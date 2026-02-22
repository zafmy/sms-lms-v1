"use client";

import { useState } from "react";
import ThreadForm from "./forms/ThreadForm";

const NewThreadToggle = ({
  courseId,
  role,
}: {
  courseId: number;
  role: string;
}) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-lamaSky text-white py-2 px-4 rounded-md text-sm hover:opacity-90"
      >
        {showForm ? "Cancel" : "New Thread"}
      </button>
      {showForm && (
        <div className="mt-4 p-4 border border-gray-200 rounded-md">
          <ThreadForm
            courseId={courseId}
            role={role}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default NewThreadToggle;
