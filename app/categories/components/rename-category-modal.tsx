"use client";

export default function RenameCategoryModal({
  open,
  initialName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold">Rename Category</h3>

        <input
          autoFocus
          defaultValue={initialName}
          className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSubmit((e.target as HTMLInputElement).value);
            }
          }}
          id="rename-category-input"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              const input = document.getElementById(
                "rename-category-input"
              ) as HTMLInputElement;
              onSubmit(input.value);
            }}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
