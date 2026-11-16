/**
 * Tiny pub/sub for the admin shell.
 *
 * AdminLayout owns the sidebar unread badge but cannot know when a page
 * mutates messages. Pages fire `notifyUnreadChanged()` after a successful
 * read/delete so the badge updates without waiting for navigation or a
 * window focus.
 */
export const UNREAD_EVENT = 'admin-unread-change'

export function notifyUnreadChanged() {
  window.dispatchEvent(new CustomEvent(UNREAD_EVENT))
}
