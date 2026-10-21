import { Playground } from "@/components/playground/playground";
import { playgroundFiles } from "@/lib/playground/files";
import { defaultPlaygroundFile } from "@/lib/playground/registry";

/**
 * The playground workspace.
 *
 * The app has a single purpose, so the page is just the playground: a
 * file selector, an editor, a live preview and a console. The header
 * carries the product name and the theme switch.
 */
export default function HomePage() {
  return (
    <Playground
      files={playgroundFiles}
      initialFile={defaultPlaygroundFile}
    />
  );
}
