/**
 * useConfirm — programmatic confirm/alert dialog
 *
 * Singleton pattern: module-level state, shared across all consumers.
 * Works both inside Vue components and in plain TS modules (e.g. TipTap extensions).
 *
 * Usage:
 *   const { showConfirm, showAlert } = useConfirm()
 *   const ok = await showConfirm('Delete this item?')
 *   if (!ok) return
 *   await showAlert('Done!')
 */

import { ref } from 'vue'

// Module-level singletons
const visible = ref(false)
const title = ref('')
const message = ref('')
const confirmText = ref('OK')
const cancelText = ref('Cancel')
const isAlertMode = ref(false)

let _resolve: (val: boolean) => void = () => {}

export interface ConfirmOptions {
  title?: string
  confirmText?: string
  cancelText?: string
}

export function useConfirm() {
  function showConfirm(msg: string, opts: ConfirmOptions = {}): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      title.value = opts.title ?? ''
      message.value = msg
      confirmText.value = opts.confirmText ?? 'Confirm'
      cancelText.value = opts.cancelText ?? 'Cancel'
      isAlertMode.value = false
      visible.value = true
      _resolve = resolve
    })
  }

  function showAlert(msg: string, opts: ConfirmOptions = {}): Promise<void> {
    return new Promise<void>(resolve => {
      title.value = opts.title ?? ''
      message.value = msg
      confirmText.value = opts.confirmText ?? 'OK'
      cancelText.value = ''
      isAlertMode.value = true
      visible.value = true
      _resolve = () => resolve()
    })
  }

  function onConfirm() {
    visible.value = false
    _resolve(true)
  }

  function onCancel() {
    visible.value = false
    _resolve(false)
  }

  return {
    visible,
    title,
    message,
    confirmText,
    cancelText,
    isAlertMode,
    showConfirm,
    showAlert,
    onConfirm,
    onCancel,
  }
}
