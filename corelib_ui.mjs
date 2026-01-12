export {Text,Button,Tooltip,
    Menu,MenuTrigger,MenuItem,MenuPopover,
} from "@fluentui/react-components";
import {FluentProvider, webLightTheme} from "@fluentui/react-components";
import {createElement as h} from "react";
export {GridDotsRegular,WrenchRegular,
LinkMultipleRegular} from "@fluentui/react-icons";
export {createElement as h} from "react";
import React from "react";
import {createRoot} from "react-dom/client";

export function RootMain(inst){
    const root_el = document.getElementById("root");
    const root_cmp = createRoot(root_el);
    root_cmp.render(h(FluentProvider, {theme: webLightTheme}, inst));
}
