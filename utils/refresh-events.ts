/** 수정/삭제 후 캘린더 화면 새로고침을 위한 이벤트 */

type Listener = () => void;
let listeners: Listener[] = [];

export function notifyRefreshNeeded() {
  listeners.forEach((l) => l());
}

export function onRefreshNeeded(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
