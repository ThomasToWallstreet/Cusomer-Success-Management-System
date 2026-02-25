import { updateThreadSectionAction } from "@/app/(dashboard)/threads/actions";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type SectionKey =
  | "goalSection"
  | "orgSection"
  | "successSection"
  | "activitySection"
  | "executionSection";

type Props = {
  id: string;
  section: SectionKey;
  label: string;
  value: unknown;
};

export function StageSectionCard({ id, section, label, value }: Props) {
  return (
    <AccordionItem value={section}>
      <AccordionTrigger>{label}</AccordionTrigger>
      <AccordionContent>
        <form action={updateThreadSectionAction} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="section" value={section} />
          <Textarea
            name="sectionJson"
            rows={8}
            defaultValue={JSON.stringify(value ?? {}, null, 2)}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            一期采用 JSON 存储分段内容。请保持合法 JSON。
          </p>
          {section === "activitySection" || section === "executionSection" ? (
            <p className="text-xs text-muted-foreground">
              建议优先使用下方“执行动作工作台”进行结构化维护。
            </p>
          ) : null}
          <Button type="submit" size="sm">
            保存{label}
          </Button>
        </form>
      </AccordionContent>
    </AccordionItem>
  );
}
