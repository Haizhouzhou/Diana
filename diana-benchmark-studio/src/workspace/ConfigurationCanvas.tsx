import { DataEditor } from "../editors/DataEditor";
import { TaskEditor } from "../editors/TaskEditor";
import { SplitEditor } from "../editors/SplitEditor";
import { PreprocessingEditor } from "../editors/PreprocessingEditor";
import { ModelEditor } from "../editors/ModelEditor";
import { MetricEditor } from "../editors/MetricEditor";
import { OutputEditor } from "../editors/OutputEditor";
import { useStudio } from "./studio-context";
const editors = { data: DataEditor, task: TaskEditor, split: SplitEditor, preprocessing: PreprocessingEditor, models: ModelEditor, metrics: MetricEditor, review: OutputEditor };
export function ConfigurationCanvas() { const { stage } = useStudio(); const Editor = editors[stage]; return <main id="main-content" className="configuration-canvas" tabIndex={-1}><Editor /></main>; }
