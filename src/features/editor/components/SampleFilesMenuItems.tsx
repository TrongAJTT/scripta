import { DropdownMenu } from "../../../shared/components/DropdownMenu";
import {
  SAMPLE_LANGUAGE_OPTIONS,
  type SampleLanguage,
} from "../../../core/constants/languages";
import { useEditorStore } from "../../tabs/store";

async function openSampleDocument(lang: SampleLanguage): Promise<void> {
  const { SAMPLE_DOCUMENTS } = await import(
    "../../../core/data/sampleDocuments"
  );
  const sample = SAMPLE_DOCUMENTS[lang];
  useEditorStore.getState().createTab(sample.filename, sample.content, lang);
}

interface SampleFilesMenuItemsProps {
  onSelectSample?: (lang: SampleLanguage) => void;
}

export function SampleFilesMenuItems({
  onSelectSample,
}: SampleFilesMenuItemsProps) {
  return (
    <>
      {SAMPLE_LANGUAGE_OPTIONS.map((opt) => (
        <DropdownMenu.Item
          key={opt.id}
          label={opt.label}
          onSelect={() => {
            void openSampleDocument(opt.id);
            onSelectSample?.(opt.id);
          }}
        />
      ))}
    </>
  );
}
