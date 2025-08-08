import { render } from "preact";
import App from "./App";
import {Toaster} from "sonner"
import "./App.css";

render(<><App /> <Toaster richColors /></>, document.getElementById("root")!);
