import { ref, onMounted } from 'vue';
import { apiGet, apiPost, apiPatch, isStaticMode } from '@/api/client';
import MemberSelect from '@/components/MemberSelect.vue';
const meetings = ref([]);
const meetingsLoading = ref(true);
const showCreate = ref(false);
const form = ref({ title: '', date: new Date().toISOString().split('T')[0], rawTranscript: '' });
const selectedParticipants = ref([]);
const selectedMeeting = ref(null);
const structurizing = ref(false);
const uploading = ref(false);
const editSummary = ref('');
const editAgenda = ref('');
const editDecisions = ref('');
const editActionItems = ref('');
async function loadMeetings() {
    if (isStaticMode()) {
        meetingsLoading.value = false;
        return;
    }
    meetingsLoading.value = true;
    const { data } = await apiGet('/api/v2/meetings');
    if (data?.meetings)
        meetings.value = data.meetings;
    meetingsLoading.value = false;
}
async function createMeeting() {
    await apiPost('/api/v2/meetings', {
        ...form.value,
        participants: selectedParticipants.value.join(', ') || null,
    });
    form.value = { title: '', date: new Date().toISOString().split('T')[0], rawTranscript: '' };
    selectedParticipants.value = [];
    showCreate.value = false;
    await loadMeetings();
}
async function viewMeeting(id) {
    const { data } = await apiGet(`/api/v2/meetings/${id}`);
    if (data?.meeting) {
        selectedMeeting.value = data.meeting;
        editSummary.value = data.meeting.summary ?? '';
        editAgenda.value = data.meeting.agenda ?? '';
        editDecisions.value = data.meeting.decisions ?? '';
        editActionItems.value = data.meeting.action_items ?? '';
    }
}
async function saveMeetingEdits() {
    if (!selectedMeeting.value)
        return;
    await apiPatch(`/api/v2/meetings/${selectedMeeting.value.id}`, {
        summary: editSummary.value || null,
        agenda: editAgenda.value || null,
        decisions: editDecisions.value || null,
        actionItems: editActionItems.value || null,
    });
    await viewMeeting(selectedMeeting.value.id);
}
async function uploadAudio(e, meetingId) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file)
        return;
    if (file.size > 25 * 1024 * 1024) {
        alert('File size exceeds 25MB limit');
        return;
    }
    uploading.value = true;
    const formData = new FormData();
    formData.append('file', file);
    const url = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('spec-auth-token') || '';
    const res = await fetch(`${url}/api/v2/meetings/${meetingId}/transcribe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    const data = await res.json();
    uploading.value = false;
    input.value = '';
    if (data.error) {
        alert(data.error);
        return;
    }
    alert('Transcription complete');
    await viewMeeting(meetingId);
}
async function structurize(id) {
    if (!selectedMeeting.value?.raw_transcript) {
        alert('No transcript available');
        return;
    }
    const { data: settingsData } = await apiGet('/api/v2/admin/settings');
    const settings = settingsData?.settings ?? {};
    const apiKey = settings.llm_api_key;
    if (!apiKey) {
        alert('Please set an API key in /admin settings');
        return;
    }
    const provider = settings.llm_provider ?? (apiKey.startsWith('sk-ant') ? 'anthropic' : apiKey.startsWith('AI') ? 'gemini' : 'openai');
    const model = settings.llm_model ?? (provider === 'openai' ? 'gpt-4o-mini' : provider === 'gemini' ? 'gemini-2.0-flash' : 'claude-sonnet-4-20250514');
    const transcript = selectedMeeting.value.raw_transcript;
    const systemPrompt = `You are an expert at structuring meeting transcripts.
Analyze the transcript below and return a JSON object:
{
  "summary": "One-line summary",
  "agenda": "Agenda items (newline-separated)",
  "decisions": "Decisions made (newline-separated)",
  "action_items": "Action items (newline-separated, include assignee on each line)"
}
Return only JSON.`;
    structurizing.value = true;
    try {
        let result;
        if (provider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: transcript }],
                    response_format: { type: 'json_object' },
                }),
            });
            const data = await res.json();
            result = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
        }
        else if (provider === 'gemini') {
            const geminiModel = model || 'gemini-2.0-flash';
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\n${transcript}` }] }],
                    generationConfig: { responseMimeType: 'application/json' },
                }),
            });
            const data = await res.json();
            const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
            const gMatch = geminiText.match(/\{[\s\S]*\}/);
            result = JSON.parse(gMatch?.[0] ?? '{}');
        }
        else {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
                body: JSON.stringify({
                    model, max_tokens: 4096, system: systemPrompt,
                    messages: [{ role: 'user', content: transcript }],
                }),
            });
            const data = await res.json();
            const text = data.content?.[0]?.text ?? '{}';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            result = JSON.parse(jsonMatch?.[0] ?? '{}');
        }
        editSummary.value = result.summary ?? '';
        editAgenda.value = result.agenda ?? '';
        editDecisions.value = result.decisions ?? '';
        editActionItems.value = result.action_items ?? '';
        await saveMeetingEdits();
        await viewMeeting(id);
    }
    catch (e) {
        alert(`AI structuring failed: ${String(e)}`);
    }
    finally {
        structurizing.value = false;
    }
}
async function createTasks(id) {
    const { data } = await apiPost(`/api/v2/meetings/${id}/create-tasks`, {});
    if (data)
        alert(`${data.created} tasks created`);
}
onMounted(loadMeetings);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['meetings-header']} */ ;
/** @type {__VLS_StyleScopedClasses['meeting-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-header']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "meetings-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "meetings-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showCreate = !__VLS_ctx.showCreate;
        } },
    ...{ class: "btn btn--primary" },
});
if (__VLS_ctx.showCreate) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "create-form glass-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "form-input" },
        placeholder: "Meeting title",
    });
    (__VLS_ctx.form.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "date",
        ...{ class: "form-input" },
    });
    (__VLS_ctx.form.date);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "participants-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "participants-label" },
    });
    /** @type {[typeof MemberSelect, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(MemberSelect, new MemberSelect({
        modelValue: (__VLS_ctx.selectedParticipants),
    }));
    const __VLS_1 = __VLS_0({
        modelValue: (__VLS_ctx.selectedParticipants),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.form.rawTranscript),
        ...{ class: "form-textarea" },
        placeholder: "Paste transcript here...",
        rows: "8",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.createMeeting) },
        ...{ class: "btn btn--primary" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "meetings-list" },
});
for (const [m] of __VLS_getVForSourceType((__VLS_ctx.meetings))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.viewMeeting(m.id);
            } },
        key: (m.id),
        ...{ class: "meeting-card glass-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "meeting-title" },
    });
    (m.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "meeting-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (m.date);
    if (m.participants) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (m.participants);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (m.created_by);
}
if (__VLS_ctx.meetingsLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
}
else if (!__VLS_ctx.meetings.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
}
if (__VLS_ctx.selectedMeeting) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "meeting-detail glass-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    (__VLS_ctx.selectedMeeting.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedMeeting))
                    return;
                __VLS_ctx.selectedMeeting = null;
            } },
        ...{ class: "btn btn--sm" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-meta" },
    });
    (__VLS_ctx.selectedMeeting.date);
    (__VLS_ctx.selectedMeeting.participants);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editSummary),
        ...{ class: "edit-textarea" },
        rows: "2",
        placeholder: "Meeting summary",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editAgenda),
        ...{ class: "edit-textarea" },
        rows: "3",
        placeholder: "Agenda items (one per line)",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editDecisions),
        ...{ class: "edit-textarea" },
        rows: "3",
        placeholder: "Decisions (one per line)",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editActionItems),
        ...{ class: "edit-textarea" },
        rows: "3",
        placeholder: "Action items (one per line, include assignee)",
    });
    if (__VLS_ctx.editActionItems) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedMeeting))
                        return;
                    if (!(__VLS_ctx.editActionItems))
                        return;
                    __VLS_ctx.createTasks(__VLS_ctx.selectedMeeting.id);
                } },
            ...{ class: "btn btn--sm btn--primary" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.saveMeetingEdits) },
        ...{ class: "btn btn--primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "btn btn--sm upload-btn" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (...[$event]) => {
                if (!(__VLS_ctx.selectedMeeting))
                    return;
                __VLS_ctx.uploadAudio($event, __VLS_ctx.selectedMeeting.id);
            } },
        type: "file",
        accept: ".mp3,.wav,.m4a,.webm,.ogg",
        hidden: true,
    });
    if (__VLS_ctx.uploading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "upload-status" },
        });
    }
    if (__VLS_ctx.selectedMeeting.raw_transcript) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedMeeting))
                        return;
                    if (!(__VLS_ctx.selectedMeeting.raw_transcript))
                        return;
                    __VLS_ctx.structurize(__VLS_ctx.selectedMeeting.id);
                } },
            ...{ class: "btn btn--sm" },
            disabled: (__VLS_ctx.structurizing),
        });
        (__VLS_ctx.structurizing ? 'AI Structuring...' : 'AI Structure');
    }
    if (__VLS_ctx.selectedMeeting.raw_transcript) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
            ...{ class: "transcript" },
        });
        (__VLS_ctx.selectedMeeting.raw_transcript);
    }
}
/** @type {__VLS_StyleScopedClasses['meetings-page']} */ ;
/** @type {__VLS_StyleScopedClasses['meetings-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['create-form']} */ ;
/** @type {__VLS_StyleScopedClasses['glass-card']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['participants-select']} */ ;
/** @type {__VLS_StyleScopedClasses['participants-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['meetings-list']} */ ;
/** @type {__VLS_StyleScopedClasses['meeting-card']} */ ;
/** @type {__VLS_StyleScopedClasses['glass-card']} */ ;
/** @type {__VLS_StyleScopedClasses['meeting-title']} */ ;
/** @type {__VLS_StyleScopedClasses['meeting-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['meeting-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['glass-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-status']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-section']} */ ;
/** @type {__VLS_StyleScopedClasses['transcript']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            MemberSelect: MemberSelect,
            meetings: meetings,
            meetingsLoading: meetingsLoading,
            showCreate: showCreate,
            form: form,
            selectedParticipants: selectedParticipants,
            selectedMeeting: selectedMeeting,
            structurizing: structurizing,
            uploading: uploading,
            editSummary: editSummary,
            editAgenda: editAgenda,
            editDecisions: editDecisions,
            editActionItems: editActionItems,
            createMeeting: createMeeting,
            viewMeeting: viewMeeting,
            saveMeetingEdits: saveMeetingEdits,
            uploadAudio: uploadAudio,
            structurize: structurize,
            createTasks: createTasks,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
