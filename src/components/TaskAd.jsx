// Task-type Adsgram blocks use their own web component instead of the
// AdController.show() pattern used by reward/interstitial blocks.
export default function TaskAd({ blockId }) {
  if (!blockId) return null;

  return (
    <div className="task" style={{ padding: 0, overflow: "hidden" }}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <adsgram-task data-block-id={blockId} data-debug="false" class="task" style={{ width: "100%" }}></adsgram-task>
    </div>
  );
}
