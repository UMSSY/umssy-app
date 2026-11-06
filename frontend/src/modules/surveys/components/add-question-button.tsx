import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SURVEY_TEXT } from "../constants/survey-builder.constants";
import type { AddQuestionButtonProps } from "../types/survey-component-props.types";

export function AddQuestionButton({ onClick }: AddQuestionButtonProps) {
  return (
    <Button
      id="survey-add-question"
      variant="outline"
      onClick={onClick}
      className="h-11 w-full rounded-lg border-[1.5px] border-dashed border-border-strong bg-surface text-accent hover:bg-interaction hover:text-accent"
    >
      <Plus aria-hidden="true" />
      {SURVEY_TEXT.addQuestion}
    </Button>
  );
}
