type ThreadOption = {
  id: string;
  ownerName: string;
  customer: string;
  keyProjectScenario: string;
};

export function ThreadMultiSelect({
  threadOptions,
  selectedOwner,
}: {
  threadOptions: ThreadOption[];
  selectedOwner?: string;
}) {
  const rows = selectedOwner
    ? threadOptions.filter((thread) => thread.ownerName === selectedOwner)
    : threadOptions;

  return (
    <div className="max-h-52 space-y-2 overflow-auto rounded border p-3">
      {rows.map((thread) => (
        <label key={thread.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="threadIds" value={thread.id} />
          <span>
            [{thread.ownerName}] {thread.customer} - {thread.keyProjectScenario}
          </span>
        </label>
      ))}
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">当前 owner 无可关联关键场景</p> : null}
    </div>
  );
}
