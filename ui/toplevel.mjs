import {
    /* Originals */
    RootMain, h, 
    /* Icons */
    GridDotsRegular,WrenchRegular, LinkMultipleRegular,
    /* FluentUI Components */
    Text,Button,Tooltip,Menu,MenuTrigger,MenuItem,MenuPopover,
    Divider,
    /* FluentUI styling hooks */
    makeStyles, tokens,
    /* React hooks */
    useState, useEffect, useRef
} from "build/corelib_ui.mjs";

const useStyles = 
    makeStyles({ 
               topbar: {
                   backgroundColor: tokens.colorBrandBackground2,
                   color: tokens.colorBrandForeground2,
                   padding: "0px",
                   display: "flex",
                   flexDirection: "row",
                   flexFlow: "nowrap",
                   width: "100%",
                   height: "48px",
                   justifyContent: "space-between",
                   alignItems: "center"
               },
               commonfooter: {
                   display: "flex",
                   flexDirection: "column",
                   alignItems: "center",
                   width: "100%"
               },
               footertext: {
                   color: tokens.colorNeutralForegroundDisabled
               }
    });


function AppList(props){
    function genmenuitems(){
        function menuitem(text){
            return h(MenuItem, {}, h(Text, {}, text));
        }
        return [
            h(MenuTrigger, {},
              h(Tooltip, {content: "Apps",
                  withArrow: true},
                h(Button, {size: "large",
                    appearance: "transparent"
                }, [h(GridDotsRegular,{})]))
            ),
            h(MenuPopover, {}, [
                menuitem("Text A"),
                menuitem("Text B")
            ])
        ];
    }
    return h(Menu, {}, genmenuitems());
};

function AppTop(props){
    return h(Text, {}, "AppName");
}

function SystemMenu(props){
    return h(Text, {}, "Sys");
}

function TopBar(props){
    const styles = useStyles();
    return h("div", {className: styles.topbar}, 
             [ 
                 /* Left */
                 h("div", {}, [h(AppList, {}), h(AppTop, {})]), 

                 /* Right */
                 h("div", {}, [h(SystemMenu, {})])
             ]);
}

function CommonFooter(props){
    const styles = useStyles();
    const textprop = {
        as: "p",
        size: 100,
        className: styles.footertext
    };
    return h("div", {className: styles.commonfooter},[
        h(Divider, {}),
        h(Text, textprop, "Powered by ..."),
        h(Text, textprop, "Debug")
    ]);
}

export function LaunchStdToplevel(app_component, props){
    /* Root */
    RootMain(h("div", {}, [
        h(TopBar, {}),
        h(app_component, props),
        h(CommonFooter, {})]));
}

