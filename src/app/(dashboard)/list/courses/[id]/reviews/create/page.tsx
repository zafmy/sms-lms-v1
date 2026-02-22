"use client";

import ReviewCardForm from "@/components/forms/ReviewCardForm";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CreateReviewCardPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      router.push(`/list/courses/${courseId}/reviews`);
    }
  }, [open, router, courseId]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <ReviewCardForm courseId={courseId} setOpen={setOpen} />
    </div>
  );
};

export default CreateReviewCardPage;
