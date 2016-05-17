dataTablesHotKeys = {};
(function(undef) {
    dataTablesHotKeys.copy = function(table) {
        var val = "";
        var t = $(table).DataTable().table();
        var rows = t.rows({selected: true});
        if (rows.count()===0) {
            rows = t.rows();
        }
        $(rows.nodes()).each(function(i, r) {
            var data = t.row(r).data();
            if (i!==0) {
                val += "\n";
            }
            $(r).children("td").each(function(i, c) {
                if (i!==0) {
                    val += "\t";
                }
                var text = data[i];
                val += text.indexOf("\n")!==-1 ? "\"" + text + "\"" : text;
            });
        });
        var hiddenDiv = $("<div>").css( {
            height: 1,
            width: 1,
            overflow: "hidden",
            position: "fixed",
            top: 0,
            left: 0
        }).appendTo(t.container());
        var textarea = $("<textarea>")
            .val(val)
            .appendTo(hiddenDiv);
        var active = document.activeElement;
        textarea[0].focus();
        textarea[0].select();
        try {
            document.execCommand("copy");
        } catch (e) {
        }
        hiddenDiv.remove();
        if ($.type(active)==="undefined") {
            active.focus();
        }
    };
    
    dataTablesHotKeys.selectAll = function(table) {
        var dTable = $(table).DataTable();
        try {
            var selected = dTable.rows({selected:true});
            var rows = dTable.rows();
            if (selected.count()===rows.count()) {
                rows.deselect();
            } else {
                rows.select();
            }
        } catch (e) {
        }
    };
    
    $(document).on("init.dt", "table", function(event) {
        //Ensure that the container of a data table has a tabindex, thus allowing hotkeys to work on the table when the wrapper or one of its child elements is clicked
        var container = $($(this).DataTable().table().container());
        if (container.attr("tabindex")===undef) {
            container.attr("tabindex", -1);
        }
    }).on("keydown", ".dataTables_wrapper", function(event) {
        if (!$(event.target).is("textarea,input")) {
            if (event.ctrlKey && !event.altKey && !event.shiftKey) {
                //CTRL
                switch (event.keyCode) {
                    case 67: //C - Only works on modern browsers that support the "copy" execution command
                        event.preventDefault();
                        event.stopPropagation();
                        dataTablesHotKeys.copy($(this).find(".dataTables_scrollBody").children("table").first());
                        return;
                    case 65: //A - Only works if the Select plugin is installed
                        event.preventDefault();
                        event.stopPropagation();
                        dataTablesHotKeys.selectAll($(this).find(".dataTables_scrollBody").children("table").first());
                        return;
                }
            }
        }
    });
})();

var dataTablesMaxHeight = {};
(function(undef) {
    var KEY = "dataTablesMaxHeight";
    var OPTIONS = KEY + ".options";
    dataTablesMaxHeight.config = function(table, options) {
        options = options===undef ? {} : options;
        $(table).data(OPTIONS, options).on({
            "draw.dt": function() {
                resize(this);
            }
        });
        $(window).on("resize", function() {
            resize(table);
        });
        return table;
    };
    
    function resize(table) {
        var winHeight = $(window).height();
        var body = $("body");
        var bodyHeight = 2 * body.outerHeight(true) - body.height();
        var tableBody = $(table).parent();
        tableBody.height(winHeight-bodyHeight+tableBody.height());
    }
})();

/*
 * The data tables editor is used with DataTables to provide a comprehensive editor for the table.
 */
dataTablesEditor = {};
(function(undef) {
    dataTablesEditor.config = function(table, options) {
        options = options===undef ? {} : options;
        var ltable = $(table).addClass("dataTablesEditor-editable")
            .data("dataTablesEditorOptions", options);
        var head = ltable.children("thead");
        var cols = head.children("tr").first().children("th");
        var tr = $("<tr>").addClass("dataTablesEditor-updateallrow").appendTo(head);
        var columns = options.columns===undef ? [] : options.columns;
        for (var ii=0;ii<cols.length;ii++) {
            var option = columns.length>ii ? columns[ii] : {};
            if (option===null) {
                option = {};
            }
            var th = $("<th>").appendTo(tr).addClass("dataTablesEditor-updateallth");
            //Always add text input
            var input = $("<textarea>").attr("rows", 1).appendTo(th).data("table", ltable[0])
                .addClass("dataTablesEditor-updateallinput")
                .on({
                    change: function() {
                        var v = $(this);
                        var th = v.closest("th");
                        var indx = th.index();
                        var table = v.data("table");
                        var options = $(table).data("dataTablesEditorOptions");
                        var maxlines = getColumnOption(options, indx, "maxlines");
                        maxlines = maxlines===undef ? 1 : maxlines;
                        var newValSplit = v.val().split("\n");
                        if (maxlines>0) {
                            if (newValSplit.length>maxlines) {
                                newValSplit = newValSplit.slice(0, maxlines);
                            }
                        }
                        v.attr("rows", newValSplit.length);
                        v.val(newValSplit.join("\n"));
                        resizeHeader(table);
                    },
                    keypress: function(event) {
                        switch (event.keyCode) {
                            //Enter key only allowed in text areas
                            case $.ui.keyCode.ENTER:
                                var v = $(this);
                                var th = v.closest("th");
                                var indx = th.index();
                                var table = v.data("table");
                                var options = $(table).data("dataTablesEditorOptions");
                                var maxlines = getColumnOption(options, indx, "maxlines");
                                maxlines = maxlines===undef ? 1 : maxlines;
                                if (maxlines===1 || v.val().split("\n").length>=maxlines) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                } else {
                                    setTimeout(function() {
                                        v.attr("rows", v.val().split("\n").length);
                                        resizeHeader(table);
                                    }, 0);
                                }
                                break;
                        }
                    },
                    keyup: function(event) {
                        var v = $(this);
                        if (v.val().length===0) {
                            v.removeClass("ui-state-highlight");
                        } else {
                            v.addClass("ui-state-highlight");
                        }
                    }
            });
            //Hide the input if not editable
            if (option.editable===false) {
                input.hide();
            }
            //Add select menu if applicable
            var selectMenuOptions = getColumnOption(options, ii, "options");
            if (selectMenuOptions!==undef) {
                var autocomplete = getColumnOption(options, ii, "autocomplete");
                if (autocomplete!==undef && autocomplete!==false) {
                    var opts = [];
                    if ($.type(selectMenuOptions)==="function") {
                        //If options is a function
                        input.data("func", selectMenuOptions);
                        input.on("focus", function(event) {
                            var v = $(this);
                            var func = v.data("func");
                            var th = v.closest("th");
                            var indx = th.index();
                            var inputs = th.parent().find("textarea");
                            //Create a fake table and row with the data from the edit row
                            var fakeTD;
                            var fakeTable = $("<table>").css("display", "none").appendTo("body");
                            try {
                                var fakeTR = $("<tr>").appendTo(table);
                                for (var jj=0;jj<inputs.length;jj++) {
                                    var td = $("<td>").text(inputs.eq(jj).val().trim()).appendTo(fakeTR);
                                    if (jj===indx) {
                                        fakeTD = td;
                                    }
                                }
                                var funcOpt = func(fakeTD[0]);
                            } finally {
                                fakeTable.remove();
                            }
                            var opts = [];
                            for (var jj=0;jj<funcOpt.length;jj++) {
                                var optVal = funcOpt[jj];
                                var optLabel = optVal;
                                if ($.type(optVal)==="array") {
                                    optLabel = optVal[0];
                                    optVal = optVal[1];
                                }
                                opts[opts.length] = {
                                    label: optLabel,
                                    value: optVal
                                };
                            }
                            v.autocomplete("option", "source", opts);
                        });
                    } else {
                        //Otherwise, create the autocomplete options
                        opts = [];
                        for (var jj=0;jj<selectMenuOptions.length;jj++) {
                            var optVal = selectMenuOptions[jj];
                            var optLabel = optVal;
                            if ($.type(optVal)==="array") {
                                optLabel = optVal[0];
                                optVal = optVal[1];
                            }
                            opts[opts.length] = {
                                label: optLabel,
                                value: optVal
                            };
                        }
                    }
                    input.autocomplete({
                        source: opts,
                        minLength: autocomplete
                    }).on("focus", function(event) {
                        var v = $(this);
                        var th = v.closest("th");
                        var autocomplete = getColumnOption($(v.data("table")).data("dataTablesEditorOptions"), th.index(), "autocomplete");
                        if (autocomplete===0) {
                            v.autocomplete("search", v.val());
                        }
                    });
                } else {
                    var select = $("<select>").appendTo(th);
                    select.append($("<option>").val("").text("Select"));
                    if ($.type(selectMenuOptions)==="function") {
                        //If options is a function, attach it to the select for later use - Do not call it now
                        select.data("func", selectMenuOptions);
                    } else {
                        //Otherwise, create the select menu options
                        for (var jj=0;jj<selectMenuOptions.length;jj++) {
                            var optVal = selectMenuOptions[jj];
                            var optLabel = optVal;
                            if ($.type(optVal)==="array") {
                                optLabel = optVal[0];
                                optVal = optVal[1];
                            }
                            var opt = $("<option>").val(optVal).text(optLabel);
                            select.append(opt);
                        }
                    }
                    select.selectmenu({
                        select: function(event, ui) {
                            var widget = $(this).selectmenu("widget");
                            var v = ui.item.value;
                            $(this).closest("th").find("textarea").val(ui.item.index===0 ? "" : v.length===0 ? " " : v);
                            if (ui.item.index===0) {
                                widget.removeClass("ui-state-highlight");
                            } else {
                                widget.addClass("ui-state-highlight");
                            }
                        },
                        open: function() {
                            var select = $(this);
                            var func = select.data("func");
                            if (func!==undef) {
                                var prevVal = select.find("option:selected");
                                prevVal = prevVal.index()===0 ? null : prevVal.val();
                                select.empty().append($("<option>").val("").text("Select"));
                                //Create a fake table and row with the data from the edit row
                                var th = select.closest("th");
                                var indx = th.index();
                                var inputs = th.parent().find("textarea");
                                var fakeTD;
                                var fakeTable = $("<table>").css("display", "none").appendTo("body");
                                try {
                                    var fakeTR = $("<tr>").appendTo(table);
                                    for (var jj=0;jj<inputs.length;jj++) {
                                        var td = $("<td>").text(inputs.eq(jj).val().trim()).appendTo(fakeTR);
                                        if (jj===indx) {
                                            fakeTD = td;
                                        }
                                    }
                                    var funcOpt = func(fakeTD[0]);
                                } finally {
                                    fakeTable.remove();
                                }
                                for (var jj=0;jj<funcOpt.length;jj++) {
                                    var optVal = funcOpt[jj];
                                    var optLabel = optVal;
                                    if ($.type(optVal)==="array") {
                                        optLabel = optVal[0];
                                        optVal = optVal[1];
                                    }
                                    var opt = $("<option>").val(optVal).text(optLabel);
                                    if (optVal===prevVal) {
                                        opt.attr("selected", true);
                                    }
                                    select.append(opt);
                                }
                                var widget = select.selectmenu("widget");
                                var width = widget.width();
                                select.selectmenu("refresh");
                                widget.width(width);
                                select.selectmenu("menuWidget").css("width", "auto");
                            }
                        },
                        position: {my: "left top", at: "left bottom", collision: "flip"}
                    });
                    var widget = select.selectmenu("widget");
                    widget.addClass("dataTablesEditor-updateallselect");
                    input.css("visibility", "hidden"); //Hide the input but keep it present on the screen
                    //Hide the select menu if not editable
                    if (option.editable===false) {
                        widget.hide();
                    }
                }
            }
        }

        //Hide the input row if instructed to do so
        if (options.inputrow===false) {
            tr.hide();
        }

        //Move editor to the cell when clicked unless multiple rows are selected unless CTRL is pressed as well
        ltable.on("click", "td", function(event) {
            //console.log(new Date().getTime() + " table click td start");
            if ($(event.target).closest(".dataTablesEditor").length!==0 || (!event.ctrlKey && !event.metaKey && !event.shiftKey)) {
                dataTablesEditor.edit(this);
            }
            //console.log(new Date().getTime() + " table click td end");
        }).on("mouseover", "td", function(event) {
            var td = $(this);
            if (!td.parent().hasClass("dataTablesEditor-deleted") && td.find("textarea").length===0) {
                var table = td.closest("table");
                var options = table.data("dataTablesEditorOptions");
                var origData = table.data("dataTablesEditorOrigData");
                var origRowIndx = getOrigRowIndex(table.DataTable().table().row(td.parent()[0]).data());
                var indx = td.index();
                if (!editable(this, options, indx)) {
                    td.addClass("dataTablesEditor-noteditable");
                }
                var valid = validate(td.text(), origRowIndx!==-1 ? origData[origRowIndx][indx] : null, td, options, indx);
                if (valid.err!==null) {
                    td.attr("title", "Error: " + valid.err);
                } else if (valid.warn!==null) {
                    td.attr("title", "Warning: " + valid.warn);
                }
            }
        }).on("mouseout", "td", function(event) {
            $(this).removeAttr("title").removeClass("dataTablesEditor-noteditable");
        });

        //Add draw event to future datatable that will resize the inputs and show the header
        ltable.on({
            "column-sizing.dt": function() {
                var table = $(this);
                //Prevent hidden inputs from being focused
                table.find(".dataTablesEditor-updateallrow").find("textarea").attr("tabindex", -1);
                //Resize the header
                resizeHeader(this);
            },
            "order.dt": function() {
                //Resize the header
                resizeHeader(this);
            },
            "draw.dt": function() {
                var table = $(this);
                //Restore scroll location
                var scroll = table.data("editorscrollloc");
                if (scroll!==undef) {
                    var parent = table.parent();
                    parent.scrollTop(scroll.top);
                    parent.scrollLeft(scroll.left);
                    table.data("editorscrollloc", undef);
                }
                //Prevent hidden inputs from being focused
                table.find(".dataTablesEditor-updateallrow").find("textarea").attr("tabindex", -1);
                //Reapply classes to those cells that have warnings or errors
                var options = table.data("dataTablesEditorOptions");
                var origData = table.data("dataTablesEditorOrigData");
                var columns = options.columns!==undef ? options.columns : [];
                $(this).DataTable().rows().every(function() {
                    var tr = $(this.node());
                    var tds = tr.children();
                    var data = this.data();
                    var origRowIndx = getOrigRowIndex(data);
                    for (var ii=0;ii<columns.length;ii++) {
                        var td = tds.eq(ii);
                        var valid = validate(data[ii], origRowIndx!==-1 ? origData[origRowIndx][ii] : null, td, options, ii);
                        if (valid.err!==null) {
                            td.addClass("dataTablesEditor-error");
                        }
                        if (valid.warn!==null) {
                            td.addClass("dataTablesEditor-warning");
                        }
                    }
                    //Remove the three main row classes then add the classes for the row in question back
                    tr.removeClass("dataTablesEditor-changed dataTablesEditor-deleted dataTablesEditor-added");
                    var clz = getRowClass(data);
                    if (clz.length!==0) {
                        tr.addClass(clz);
                    }
                });
            },
            "init.dt": function() {
                var t = $(this);
                var options = t.data("dataTablesEditorOptions");
                var dTable = $(this).DataTable();
                //Add contenteditable div to container
                var container = $(dTable.table().container());
                setTimeout(function() {
                    //Must delay the creation of the DIV to allow the event handlers to finish, leaving this to be last
                    container.prepend($("<span>").attr("contenteditable", true).addClass("dataTablesEditor-pastesection").attr("tabindex", -1).on("keydown", function(event) {
                        var prevent = true;
                        switch (event.which) {
                            case $.ui.keyCode.TAB:
                                prevent = event.ctrlKey || event.altKey || event.metaKey;
                                break;
                            case 45: //Insert
                            case 46: //Delete
                                prevent = event.ctrlKey || event.altKey || event.metaKey || event.shiftKey;
                                break;
                            case 86: //V - Allow paste to go through, but clear the previous contenteditable text
                                $(this).text(""); //Clear the previous text
                            case 67: //C - Allow copy to go through
                            case 65: //A - Allow select all to go through
                                prevent = !event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
                        }
                        if (prevent) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }));
                    //Ensure that container has a tabindex
                    if (container.attr("tabindex")===undef) {
                        container.attr("tabindex", -1);
                    }
                    //Add a click event to the container
                    container.on("click", function(event) {
                        var target = $(event.target);
                        //Do not focus on the contenteditable elemetn if about to edit a cell or the nearest "focusable" element is not the datatables container/wrapper
                        if (target.children(".dataTablesEditor-input").length===0 && target.closest(":focusable")[0]===this) {
                            //Redirect focus to the content editable span - This will allow the paste function to work in IE which needs something to "paste" into
                            $(this).children("span[contenteditable]").focus();
                        }
                    });
                }, 0);
                //Add helper buttons to top of table
                if (options.toolbar!==false) {
                    var top = container.children().first();
                    if (top.find("dataTablesEditor-toolbar").length===0) {
                        var table = $("<table>").attr("cellpadding", 0).attr("cellspacing", 0).appendTo($("<div>").addClass("dataTablesEditor-toolbar").appendTo(top));
                        var tr = $("<tr>").appendTo(table);
                        $("<button>").text("Insert").attr("title", "Insert a new row.").appendTo($("<td>").appendTo(tr)).data("editortable", this).on("click", function() {
                            insertRow($($(this).data("editortable")));
                        }).button();
                        $("<button>").text("Update").attr("title", "Update selected rows.").appendTo($("<td>").appendTo(tr)).data("editortable", this).on("click", function() {
                            allSelected(this, "update");
                        }).button();
                        $("<button>").text("Copy").attr("title", "Copy selected rows.").appendTo($("<td>").appendTo(tr)).data("editortable", this).on("click", function() {
                            dataTablesHotKeys.copy($(this).data("editortable"));
                        }).button();
                        $("<button>").text("Paste").attr("title", "Paste in rows.").appendTo($("<td>").appendTo(tr)).data("editortable", this).on("click", function() {
                            dialogError.children("p").html("Please use Control-V when pasting data.");
                            dialogError.dialog({
                                dialogClass: "dataTablesEditor",
                                modal: true,
                                title: "Keyboard Only",
                                minHeight: "0px",
                                width: "auto",
                                resizable: false,
                                buttons: [
                                    {text: "Ok", click: function() {$(this).dialog("close");}}
                                ]
                            });
                        }).button();
                        $("<button>").text("Delete").attr("title", "Delete/undelete selected rows.").appendTo($("<td>").appendTo(tr)).data("editortable", this).on("click", function() {
                            allSelected(this, "delete");
                        }).button();
                        $("<button>").text("Reset").attr("title", "Reset inputs.").appendTo($("<td>").appendTo(tr)).data("editortable", this).on("click", function() {
                            var header = $($($(this).data("editortable")).DataTable().table().header()).find(".dataTablesEditor-updateallrow");
                            header.find("textarea").val("").removeClass("ui-state-highlight");
                            header.find("select").each(function(i, e) {
                                e = $(e);
                                var widget = e.selectmenu("widget");
                                var width = widget.width();
                                e.children().first().prop("selected", true);
                                e.selectmenu("refresh");
                                widget.width(width).removeClass("ui-state-highlight");
                            });
                        }).button();
                        $("<button>").text("Help").attr("title", "Editor help.").appendTo($("<td>").appendTo(tr)).on("click", function() {
                            var html = "<b>Updating en masse and the input fields:</b>\n\
<ul>\n\
<li>The \"Update\" button will update all selected rows with the inputs specified.</li>\n\
<li>To clear a value in all selected rows, enter a space ' ' in the desired input.</li>\n\
<li>The \"Reset\" button will clear all the input values used by \"Update\".<p></p></li>\n\
<li>Note: When inserting a new row, or pasting data, the inputs will be used as substitutes for the inserted rows.<p></p></li>\n\
</ul>\n\
<b>Hotkeys:</b> You must click somewhere within the table or its control area for the hotkeys to work.\n\
<ul>\n\
<li>Control-A: Select/deselect all rows, same as clicking \"Select All\".</li>\n\
<li>Control-C: Copy selected/all rows to the clipboard in tabular format, same as clicking \"Copy\".</li>\n\
<li>Control-V: Paste tabular data from the clipboard into the table.</li>\n\
<li>Insert: Insert a new row, same as clicking \"Insert\".</li>\n\
<li>Delete: Delete selected rows, same as clicking \"Delete\".</li>\n\
</ul>";

                            dialogError.children("p").html(html);
                            dialogError.dialog({
                                dialogClass: "dataTablesEditor",
                                modal: true,
                                title: "Help",
                                minHeight: "0px",
                                width: "auto",
                                resizable: false,
                                buttons: [
                                    {text: "Ok", click: function() {$(this).dialog("close");}}
                                ]
                            });
                        }).button();
                    }
                }
            }
        });
        return table;
    };

    dataTablesEditor.edit = function(td, dir) {
        //console.log(new Date().getTime() + " edit start");
        var ltd = $(td);
        var table = ltd.closest("table");
        var indx = ltd.index();
        var dTable = table.DataTable();

        if (!ltd.parent().hasClass("dataTablesEditor-deleted")) {
            if (ltd.find(editorInput).length!==0) {
                dTable.row(ltd.parent()[0]).select();
            } else {
                //Commit any previous change
                if (commitChange()) {

                    //Remove all tooltips
                    $(".ui-tooltip").remove();
                    var val = dTable.cell(ltd[0]).data();
                    var options = table.data("dataTablesEditorOptions");

                    //Determine if cell can actually be edited
                    if (!ltd.is(".dataTables_empty") && editable(ltd[0], options, indx)) {
                        //Deselect all rows and select the one row
                        dTable.rows().deselect();
                        dTable.row(ltd.parent()[0]).select();

                        var selectMenuOptions = getColumnOption(options, indx, "options");
                        //Convert select menu options if function before cell is emptied
                        if ($.type(selectMenuOptions)==="function") {
                            selectMenuOptions = selectMenuOptions(ltd[0]);
                        }

                        //Size the input to that of the cell, and set the font
                        var css = ltd.css(["font-family", "font-size", "padding-top", "padding-bottom", "padding-left", "padding-right"]);
                        var w = ltd.width();
                        var h = ltd.height();

                        editorInput.val(val);
                        editorInput.css(css).width(w).height(h).data("td", ltd[0]).data("value", val).appendTo(ltd).show();
                        if (selectMenuOptions!==undef) {
                            var autocomplete = getColumnOption(options, indx, "autocomplete");
                            if (autocomplete!==undef && autocomplete!==false) {
                                var opts = [];
                                for (var ii=0;ii<selectMenuOptions.length;ii++) {
                                    var optVal = selectMenuOptions[ii];
                                    var optLabel = optVal;
                                    if ($.type(optVal)==="array") {
                                        optLabel = optVal[0];
                                        optVal = optVal[1];
                                    }
                                    opts[opts.length] = {
                                        label: optLabel,
                                        value: optVal
                                    };
                                }
                                var within = table.parent();
                                editorInput.autocomplete("option", {
                                    source: opts,
                                    minLength: autocomplete,
                                    appendTo: within,
                                    position: {my: "left top", at: "left bottom", collision: "flip", within: within}
                                });
                                editorInput.focus();
                                //Move caret to a location based on direction
                                if (dir==="right") {
                                    moveCaretToEnd(editorInput[0]);
                                } else if (dir==="left") {
                                    moveCaretToStart(editorInput[0]);
                                }
                            } else {
                                editorInput.autocomplete("option", "source", []);
                                editorSelect.empty();
                                for (var ii=0;ii<selectMenuOptions.length;ii++) {
                                    var optVal = selectMenuOptions[ii];
                                    var optLabel = optVal;
                                    if ($.type(optVal)==="array") {
                                        optLabel = optVal[0];
                                        optVal = optVal[1];
                                    }
                                    var opt = $("<option>").val(optVal).text(optLabel);
                                    if (optVal===val) {
                                        opt.attr("selected", true);
                                    }
                                    editorSelect.append(opt);
                                }
                                editorSelect.selectmenu("refresh");
                                var widget = editorSelect.selectmenu("widget");
                                //Show and focus the menu button
                                widget.css(css).width(w).height(h).appendTo(ltd).show().focus();
                                var within = table.parent();
                                editorSelect.selectmenu("option", {
                                    appendTo: within,
                                    position: {my: "left top", at: "left bottom", collision: "flip", within: within}
                                });
                                editorSelect.selectmenu("open"); //This may cause a "select" event, must guard against it in the "select" event handler
                                editorSelect.selectmenu("menuWidget").css("width", "auto");
                            }
                        } else {
                            editorInput.autocomplete("option", "source", []);
                            editorInput.focus();
                            //Move caret to a location based on direction
                            if (dir==="right") {
                                moveCaretToEnd(editorInput[0]);
                            } else if (dir==="left") {
                                moveCaretToStart(editorInput[0]);
                            }
                        }
                    }
                }
            }
        }
        //console.log(new Date().getTime() + " edit end");
        return td;
    };

    dataTablesEditor.data = function(table, data) {
        var t = $(table);
        var n = t.children("thead").children("tr.dataTablesEditor-updateallrow").children("th").length;
        /*
         * Add a field for storing a "class" name to associate with the row, and store the current index in the multi-dimensional array
         * This is to ensure if the data is filtered somehow the original index of each row is preserved.
         */
        var orig = [];
        var length = null;
        for (var ii=0;ii<data.length;ii++) {
            var row = data[ii];
            orig[orig.length] = row.slice(0);
            //Ensure each row is of the same length
            if (length===null) {
                length = row.length;
            } else if (row.length!==length) {
                throw new Exception("Row at index " + ii + " is not of the same length as the row at index 0, namely " + length);
            }
            addAdditionalColumns(row, "", ii, ii);
        }
        //Store data for later use
        t.data("editordata", data);
        t.data("dataTablesEditorOrigData", orig);

        return setData(table, data);
    };

    dataTablesEditor.getValue = function(td) {
        td = $(td);
        if (td.children(".dataTablesEditor-input").length===0) {
            return td.text();
        } else {
            return td.closest("table").DataTable().table().cell(td[0]).data().toString();
        }
    };

    dataTablesEditor.validate = function(table) {
        var ret = {
            err: [],
            warn: []
        };
        var data = $(table).data("editordata");
        var origData = $(table).data("dataTablesEditorOrigData");
        var options = $(table).data("dataTablesEditorOptions");
        //Create a fake table and row with the data from the edit row
        var fakeTable = $("<table>").css("display", "none").appendTo("body");
        var fakeTR = $("<tr>").appendTo($("<tbody>").appendTo(fakeTable));
        try {
            var tds;
            for (var ii=0;ii<data.length;ii++) {
                var row = getRowInfo(data[ii]);
                if (ii===0) {
                    for (var jj=0;jj<row.data.length;jj++) {
                        $("<td>").appendTo(fakeTR);
                    }
                    tds = fakeTR.children("td");
                }
                if (row.clz.indexOf("dataTablesEditor-deleted")===-1) {
                    for (var jj=0;jj<row.data.length;jj++) {
                        tds.eq(jj).text(row.data[jj]);
                    }
                    for (var jj=0;jj<row.data.length;jj++) {
                        var td = tds.eq(jj);
                        var valid = validate(row.data[jj], row.origindx!==-1 ? origData[row.origindx][jj] : null, td, options, jj);
                        if (valid.err!==null) {
                            ret.err[ret.err.length] = {
                                data: row.data,
                                msg: valid.err
                            };
                        }
                        if (valid.warn!==null) {
                            ret.warn[ret.warn.length] = {
                                data: row.data,
                                msg: valid.warn
                            };
                        }
                    }
                }
            }
        } finally {
            fakeTable.remove();
        }
        return ret;
    };

    dataTablesEditor.getChanges = function(table) {
        var data = $(table).data("editordata");
        var origdata = $(table).data("dataTablesEditorOrigData");
        var ret = {
            total: 0,
            deleted: [],
            added: [],
            changed: []
        };
        for (var ii=0;ii<data.length;ii++) {
            var d = getRowInfo(data[ii]);
            if (d.clz.indexOf("dataTablesEditor-deleted")!==-1) {
                if (d.origindx!==-1) {
                    ret.deleted[ret.deleted.length] = {
                        data: origdata[d.origindx]
                    };
                    ret.total++;
                }
            } else if (d.clz.indexOf("dataTablesEditor-changed")!==-1) {
                if (d.origindx!==-1) {
                    ret.changed[ret.changed.length] = {
                        dataBefore: origdata[d.origindx],
                        dataAfter: d.data
                    };
                    ret.total++;
                } else {
                    ret.added[ret.added.length] = {
                        data: d.data
                    };
                    ret.total++;
                }
            }
        }
        return ret;
    };

    //Widgets
    var dialogError, editorInput, editorSelect, editorSelectMenu;
    //Is the select menu on the first or last item (used with keyboard navigation)
    var editorSelectFirst, editorSelectLast;
    
    //Create the widgets necessary to support the editor after the window has finished loading
    $(window).on({
        load: function() {
            dialogError = $("<div>").append($("<p>")).hide().appendTo("body");
            editorInput = $("<textarea>").attr("rows", 1).uniqueId().addClass("dataTablesEditor-input dataTablesEditor").hide().appendTo("body").on({
                keypress: function(event) {
                    switch (event.keyCode) {
                        //Enter key only gets sent when its a "keypress" only - Commit the change and move to next cell up (if shift) or down
                        case $.ui.keyCode.ENTER:
                            var v = this;
                            var maxLines = getMaxLines(v);
                            if (maxLines!==1) {
                                if (maxLines<1 || $(v).val().split("\n").length<maxLines) {
                                    return;
                                }
                            } else {
                                commitChange(false, event.shiftKey ? "upover" : "downover");
                            }
                            event.preventDefault();
                            event.stopPropagation();
                            return;
                    }
                },
                keydown: function(event) {
                    switch (event.keyCode) {
                        case $.ui.keyCode.ESCAPE:
                            //On escape hide editor and refocus on the data table wrapper (to allow hotkeys to work on table)
                            editorInput.hide().appendTo("body");
                            var cell = $(editorInput.data("td"));
                            $(cell.closest("table").DataTable().table().container()).children(".dataTablesEditor-pastesection").focus();
                            return;
                        case $.ui.keyCode.TAB:
                            //On TAB, move to the left (if shift key) or right
                            event.preventDefault();
                            event.stopPropagation();
                            return commitChange(false, event.shiftKey ? "leftover" : "rightover");
                        case $.ui.keyCode.UP:
                            //Move up if autocomplete menu is not visible
                            if (!$(this).autocomplete("widget").is(":visible") && (getMaxLines(this)===1 || getCaretPosition(this)===0)) {
                                event.preventDefault();
                                event.stopPropagation();
                                commitChange(false, "up");
                            }
                            return;
                        case $.ui.keyCode.DOWN:
                            //Move down if autocomplete menu is not visible
                            if (!$(this).autocomplete("widget").is(":visible") && (getMaxLines(this)===1 || getCaretPosition(this)===$(this).val().length)) {
                                event.preventDefault();
                                event.stopPropagation();
                                commitChange(false, "down");
                            }
                            return;
                        case $.ui.keyCode.LEFT:
                            //Move right
                            if (getCaretPosition(this)===0) {
                                event.preventDefault();
                                event.stopPropagation();
                                commitChange(false, "left");
                            }
                            return;
                        case $.ui.keyCode.RIGHT:
                            //Move left
                            if (getCaretPosition(this)===$(this).val().length) {
                                event.preventDefault();
                                event.stopPropagation();
                                commitChange(false, "right");
                            }
                            return;
                    }
                },
                focus: function(event) {
                    //Is autocomplete
                    var v = $(this);
                    var td = v.closest("td");
                    var autocomplete = getColumnOption(v.closest("table").data("dataTablesEditorOptions"), td.index(), "autocomplete");
                    if (autocomplete===0) {
                        v.autocomplete("search", v.val());
                    }
                }
            }).autocomplete({
                source: [],
                open: function(event, ui) {
                    $(this).autocomplete("widget").addClass("dataTablesEditor");
                }
            });

            //Create the select menu for use with inputs
            editorSelect = $("<select>").uniqueId().appendTo("body");
            editorSelect.selectmenu({
                select: function(event, ui) {
                    //Its possible the select event is triggered before the menu is opened.  Ensure that commit is not unnecessarily called
                    if (editorSelect.selectmenu("widget").is(":visible")) {
                        editorInput.val(ui.item.value);
                        commitChange(false, event.keyCode===$.ui.keyCode.ENTER ? event.shiftKey ? "upover" : "downover" : false);
                    }
                },
                close: function(event) {
                    //On close, commit the change and go to the next input if the TAB key was pressed
                    var next = false;
                    if (event.keyCode===$.ui.keyCode.TAB) {
                        next = "rightover";
                        if (event.shiftKey) {
                            next = "leftover";
                        }
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    commitChange(false, next);
                },
                open: function() {
                    //Set the variables for holding if the select menu is on the first or last item
                    editorSelectFirst = editorSelectMenu.menu("isFirstItem");
                    editorSelectLast = editorSelectMenu.menu("isLastItem");
                },
                focus: function() {
                    /*
                     * Called when an item in the select menu is focused.  This can be
                     * the result of a keyboard event, which will be triggered immediately
                     * afterward (see below).
                     */
                    var first = editorSelectMenu.menu("isFirstItem");
                    var last = editorSelectMenu.menu("isLastItem");
                    /*
                     * Delay setting if on the first or last select menu item when focusing on an item.
                     * This is necessary since the keydown event comes immediately after the focus event
                     * and would force the navigation to the next cell.  Delaying it causes
                     * the "next" key to perform the navigation.
                     */
                    if (first && !editorSelectFirst) {
                        return setTimeout(function() {editorSelectFirst=true;},0);
                    } else if (last && !editorSelectLast) {
                        return setTimeout(function() {editorSelectLast=true;},0);
                    }
                    editorSelectFirst = first;
                    editorSelectLast = last;
                }
            });
            editorSelectMenu = editorSelect.selectmenu("menuWidget");
            editorSelect.selectmenu("widget").css("display", "flex").hide().addClass("dataTablesEditor-input dataTablesEditor").on({
                keydown: function(event) {
                    switch (event.keyCode) {
                        case $.ui.keyCode.UP:
                            //Go to the input directly above if "currently" on the first item in the select menu
                            if (editorSelectMenu.menu("isFirstItem") && editorSelectFirst) {
                                event.preventDefault();
                                event.stopPropagation();
                                commitChange(false, "up");
                            }
                            return;
                        case $.ui.keyCode.DOWN:
                            //Go to the input directly below if "currently" on the last item in the select menu
                            if (editorSelectMenu.menu("isLastItem") && editorSelectLast) {
                                event.preventDefault();
                                event.stopPropagation();
                                commitChange(false, "down");
                            }
                            return;
                        case $.ui.keyCode.LEFT:
                            //Go to the input directly to the left (this overrides the default behaviour of going to the next item in the select menu)
                            event.preventDefault();
                            event.stopPropagation();
                            return commitChange(false, "left");
                        case $.ui.keyCode.RIGHT:
                            //Go to the input directly to the right (this overrides the default behaviour of going to the next item in the select menu)
                            event.preventDefault();
                            event.stopPropagation();
                            return commitChange(false, "right");
                    }
                }
            });
            editorSelectMenu.removeClass("ui-corner-bottom").parent().addClass("dataTablesEditor");
        }
    });
    
    $(document).on({
        mousedown: function(event) {
            //console.log(new Date().getTime() + " document mousedown start");
            var v = $(event.target).closest(".dataTablesEditor,.ui-widget-overlay");
            if (v.length===0) {
                commitChange();
            }
            //console.log(new Date().getTime() + " document mousedown end");
        }
    }).on("keydown", ".dataTables_wrapper", function(event) {
        if (!$(event.target).is("textarea,input") && !editorInput.is(":visible")) {
            if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
                switch (event.keyCode) {
                    case 45: //Insert
                        event.preventDefault();
                        event.stopPropagation();
                        insertRow($(this).find(".dataTables_scrollBody table.dataTablesEditor-editable"));
                        return;
                    case 46: //Delete
                        event.preventDefault();
                        event.stopPropagation();
                        var table = $(this).find(".dataTables_scrollBody table.dataTablesEditor-editable");
                        allSelectedDo("delete", table, table.DataTable().rows({selected:true}), null);
                        return;
                }
            }
        }
    }).on("paste", ".dataTables_wrapper", function(event) {
        if (!$(event.target).is("textarea,input")) {
            var table = $(this).find(".dataTables_scrollBody table.dataTablesEditor-editable");
            var options = table.data("dataTablesEditorOptions");
            var inputs = $(this).find(".dataTablesEditor-updateallrow").find(".dataTablesEditor-updateallinput");
            var cols = options.columns;
            cols = cols===undef ? [] : cols;
            var length = $(table.DataTable().table().header()).children("tr.dataTablesEditor-updateallrow").children("th").length;
            var arr;
            try {
                arr = event.originalEvent.clipboardData.getData("text");
            } catch (e) {
                arr = window.clipboardData.getData("Text");
            }
            if (arr.length===0) {
                return;
            }
            //Do not split on new line as data may itself contain new lines
            arr = arr.split(/\t/g);
            var newArr = [];
            var row = [];
            for (var ii=0;ii<arr.length;ii++) {
                var v = arr[ii];
                var extracted = false;
                if (v.indexOf("\"")===0) {
                    var indx = v.lastIndexOf("\"");
                    row[row.length] = v.substring(1, indx);
                    v = v.substring(indx+1);
                    extracted = true;
                }
                var r = v.indexOf("\r");
                var n = v.indexOf("\n");
                if (r!==-1 || n!==-1) {
                    var l = 1;
                    if (n!==-1) {
                        if (r!==-1) {
                            l = 2;
                            n = r;
                        }
                    } else {
                        n = r;
                    }
                    if (!extracted) {
                        row[row.length] = v.substring(0, n);
                    }
                    n += l;
                    newArr[newArr.length] = row;
                    row = [];
                    row[row.length] = v.substring(n);
                } else if (!extracted) {
                    row[row.length] = v;
                }
            }
            newArr[newArr.length] = row;

            //Create a fake table and row with the data from the edit row
            var tds = null;
            var fakeTable = $("<table>").css("display", "none").appendTo("body");
            try {
                for (var ii=0;ii<newArr.length;ii++) {
                    var row = newArr[ii];
                    //Replace value with that from inputs and apply restrictions
                    for (var jj=0;jj<row.length;jj++) {
                        if (inputs.length>jj) {
                            var input = inputs.eq(jj).val();
                            if (input.length!==0) {
                                row[jj] = input.trim();
                            }
                        }
                        var c = cols.length>jj ? cols[jj] : null;
                        if (c!==null) {
                            if (c.editable===false) {
                                row[jj] = "";
                            } else {
                                row[jj] = applyRestrictions(row[jj], c.maxlines);
                            }
                        }
                    }
                    //Pad/truncate the rows
                    if (row.length>length) {
                        row.splice(length, row.length-length);
                    } else if (row.length<length) {
                        for (var jj=row.length;jj<length;jj++) {
                            row[row.length] = "";
                        }
                    }

                    //Validate and Translate
                    if (tds===null) {
                        var tr = $("<tr>").appendTo(fakeTable);
                        for (var jj=0;jj<row.length;jj++) {
                            tr.append($("<td>"));
                        }
                        tds = tr.children();
                    }
                    
                    //Fill in the row
                    for (var jj=0;jj<row.length;jj++) {
                        tds.eq(ii).text(row[jj]);
                    }
                    
                    //Editable, validate and translate each cell
                    for (var jj=0;jj<row.length;jj++) {
                        var val = new String(row[jj]).trim();
                        var td = tds.eq(jj);
                        if (editable(td[0], options, jj)) {
                            var valid = validate(val, null, td, options, jj);
                            if (valid.err===null) {
                                var translate = getColumnOption(options, jj, "translate");
                                if (translate!==undef) {
                                    val = translate(val, td[0]).toString().trim();
                                }
                            }
                        } else {
                            val = "";
                        }
                        row[jj] = val;
                    }

                    //Add additional columns to handle the class and index location
                    addAdditionalColumns(row, "dataTablesEditor-changed dataTablesEditor-added");
                }
            } finally {
                fakeTable.remove();
            }

            addData(table, newArr);
        }
    });

    function getCaretPosition(v) {
        //Initialize
        var iCaretPos = 0;
        //IE Support
        if (document.selection) {
            //To get cursor position, get empty selection range
            var oSel = document.selection.createRange();
            //Move selection start to 0 position
            oSel.moveStart('character', -v.value.length);
            //The caret position is selection length
            iCaretPos = oSel.text.length;
        } else if (v.selectionStart || v.selectionStart === '0') {
            //Firefox support
            iCaretPos = v.selectionStart;
        }
        return iCaretPos;
    }

    function getMaxLines(v) {
        var td = $(v).closest("td");
        var indx = td.index();
        var options = td.closest("table").data("dataTablesEditorOptions");
        var maxLines = getColumnOption(options, indx, "maxlines");
        return maxLines===undef ? 1 : maxLines;
    }

    function validate(newValue, origValue, td, options, indx) {
        var ret = {err: null, warn: null};
        var v = getColumnOption(options, indx, "validate");
        if (v!==undef) {
            var obj = v(newValue, origValue, td);
            if ($.type(obj)==="string") {
                ret.err = obj;
            } else if ($.type(obj)==="object") {
                if (obj.error) {
                    ret.err = obj.error;
                } else if (obj.warning) {
                    ret.warn = obj.warning;
                }
            }
        }
        return ret;
    }

    function getColumnOption(options, indx, option) {
        if (options.columns!==undef && options.columns.length>indx) {
            var colOptions = options.columns[indx];
            if (colOptions!==null) {
                return colOptions[option];
            }
        }
        return undef;
    }

    function editable(td, options, indx) {
        var v = getColumnOption(options, indx, "editable");
        if (v===false) {
            return false;
        } else if ($.type(v)==="function") {
            return v(td);
        } else {
            return true;
        }
    }

    function applyRestrictions(val, maxlines) {
        maxlines = maxlines===undef ? 1 : maxlines;
        if (maxlines>0) {
            var newValSplit = val.split("\n");
            if (newValSplit.length>maxlines) {
                val = newValSplit.slice(0, maxlines).join("\n").trim();
            }
        }
        return val;
    }

    function commitChange(skipValidate, editNext) {
        //console.log(new Date().getTime() + " commitChange start");
        if (editorInput.css("display")!=="none") {
            var cell = editorInput.data("td");
            var cellJQuery = $(cell);
            var parent = cellJQuery.parent();
            var val = editorInput.data("value");
            var table = cellJQuery.closest("table");
            var dTable = table.DataTable();
            var newVal = editorInput.val();
            var options = table.data("dataTablesEditorOptions");
            var indx = cellJQuery.index();
            var trans = true;

            //Shrink if greater than max lines (possible if they pasted into the input
            var maxlines = getColumnOption(options, indx, "maxlines");
            newVal = applyRestrictions(newVal, maxlines);

            //Validate
            var origData = table.data("dataTablesEditorOrigData");
            var origRowIndx = getOrigRowIndex(dTable.table().row(parent[0]).data());
            if (!skipValidate) {
                var valid = validate(newVal, origRowIndx!==-1 ? origData[origRowIndx][indx] : null, cellJQuery, options, indx);
                trans = valid.err===null;
            }

            //Translate
            if (trans) {
                var translate = getColumnOption(options, indx, "translate");
                if (translate!==undef) {
                    newVal = translate(newVal, cell).toString().trim();
                }
            }
            editorInput.hide().appendTo("body");
            var editorSelectVisible = getColumnOption(options, indx, "options")!==undef;
            editorSelect.selectmenu("close").selectmenu("widget").hide();
            editorSelect.selectmenu("menuWidget").parent().insertAfter(editorSelect);

            if (val.localeCompare(newVal)!==0) {
                dTable.cell(cell).data(newVal);
                
                //Indicate value has changed
                var d = dTable.row(parent[0]).data();
                setRowClass(d, "dataTablesEditor-changed");
                parent.addClass("dataTablesEditor-changed");
                //Resize the table
                dTable.columns.adjust();

                var tds = parent.children().removeClass("dataTablesEditor-error dataTablesEditor-warning");
                tds.each(function(i, e) {
                    e = $(e);
                    var valid = validate(e.text(), origRowIndx!==-1 ? origData[origRowIndx][i] : null, e, options, i);
                    if (valid.err!==null) {
                        e.addClass("dataTablesEditor-error");
                    } else if (valid.warn!==null) {
                        e.addClass("dataTablesEditor-warning");
                    }
                });
            }

            //Go to next cell if instructed to do so
            if (editNext) {
                var tr = parent;
                var tds;
                var nextIndx = -1;
                var wrapped = false;
                if (editNext==="up" || editNext==="upover") {
                    while (nextIndx===-1) {
                        var nextTR = tr.prev();
                        if (nextTR.length===0) {
                            tr = tr.parent().children("tr").last();
                            if (editNext==="upover") {
                                indx--;
                            }
                        } else {
                            tr = nextTR;
                        }
                        if (!tr.is(".dataTablesEditor-deleted")) {
                            tds = tr.children("td");
                            if (indx===-1) {
                                indx = tds.length-1;
                            }
                            if (editable(tds.eq(indx)[0], options, indx)) {
                                nextIndx = indx;
                                break;
                            }
                        }
                    }
                } else if (editNext==="down" || editNext==="downover") {
                    while (nextIndx===-1) {
                        var nextTR = tr.next();
                        if (nextTR.length===0) {
                            tr = tr.parent().children("tr").first();
                            if (editNext==="downover") {
                                indx++;
                            }
                        } else {
                            tr = nextTR;
                        }
                        if (!tr.is(".dataTablesEditor-deleted")) {
                            tds = tr.children("td");
                            if (indx===tds.length) {
                                indx = 0;
                            }
                            if (editable(tds.eq(indx)[0], options, indx)) {
                                nextIndx = indx;
                                break;
                            }
                        }
                    }
                } else if (editNext==="left") {
                    tds = tr.children("td");
                    for (var ii=indx-1;ii>=0;ii--) {
                        if (editable(tds.eq(ii)[0], options, ii)) {
                            nextIndx = ii;
                            break;
                        }
                    }
                    if (nextIndx===-1) {
                        for (var ii=tds.length-1;ii>=indx;ii--) {
                            if (editable(tds.eq(ii)[0], options, ii)) {
                                nextIndx = ii;
                                break;
                            }
                        }
                    }
                } else if (editNext==="right") {
                    tds = tr.children("td");
                    for (var ii=indx+1;ii<tds.length;ii++) {
                        if (editable(tds.eq(ii)[0], options, ii)) {
                            nextIndx = ii;
                            break;
                        }
                    }
                    if (nextIndx===-1) {
                        for (var ii=0;ii<=indx;ii++) {
                            if (editable(tds.eq(ii)[0], options, ii)) {
                                nextIndx = ii;
                                break;
                            }
                        }
                    }
                } else if (editNext==="leftover") {
                    tds = tr.children("td");
                    while (nextIndx===-1) {
                        if (!tr.is(".dataTablesEditor-deleted")) {
                            for (var ii=indx-1;ii>=0;ii--) {
                                if (editable(tds.eq(ii)[0], options, ii)) {
                                    nextIndx = ii;
                                    break;
                                }
                            }
                        }
                        if (nextIndx===-1) {
                            var nextTR = tr.prev();
                            if (nextTR.length===0) {
                                if (wrapped) {
                                    break;
                                }
                                tr = tr.parent().children("tr").last();
                                wrapped = true;
                            } else {
                                tr = nextTR;
                            }
                            tds = tr.children("td");
                            indx = tds.length;
                        }
                    }
                } else if (editNext==="rightover") {
                    tds = tr.children("td");
                    while (nextIndx===-1) {
                        if (!tr.is(".dataTablesEditor-deleted")) {
                            for (var ii=indx+1;ii<tds.length;ii++) {
                                if (editable(tds.eq(ii)[0], options, ii)) {
                                    nextIndx = ii;
                                    break;
                                }
                            }
                        }
                        if (nextIndx===-1) {
                            var nextTR = tr.next();
                            if (nextTR.length===0) {
                                if (wrapped) {
                                    break;
                                }
                                tr = tr.parent().children("tr").first();
                                wrapped = true;
                            } else {
                                tr = nextTR;
                            }
                            indx = -1;
                            tds = tr.children("td");
                        }
                    }
                }

                if (nextIndx!==-1) {
                    //Delay editing to allow select menu to properly close (There is a bug somewhere in JQuery UI)
                    if (editorSelectVisible) {
                        $(dTable.table().container()).children(".dataTablesEditor-pastesection").focus();
                        setTimeout(function() {
                            dataTablesEditor.edit(tds.eq(nextIndx), editNext);
                        }, 0);
                    } else {
                        dataTablesEditor.edit(tds.eq(nextIndx), editNext);
                    }
                    return true;
                }
            }
            
            $(dTable.table().container()).children(".dataTablesEditor-pastesection").focus();
        }
        //console.log(new Date().getTime() + " commitChange end");
        return true;
    }

    function moveCaretToStart(el) {
        if (el.createTextRange) {
            var range = el.createTextRange();
            range.move("character", 0);
            range.select();
        } else if (el.setSelectionRange) {
            el.setSelectionRange(0, 0);
        }
    }

    function moveCaretToEnd(el) {
        if (el.createTextRange) {
            var range = el.createTextRange();
            range.collapse(false);
            range.select();
        } else if (el.setSelectionRange) {
            var n = el.value.length;
            el.setSelectionRange(n, n);
        }
    }

    function addAdditionalColumns(row, clz, origIndx, curIndx) {
        row[row.length] = clz===undef ? "" : clz;
        row[row.length] = origIndx===undef ? -1 : origIndx;
        row[row.length] = curIndx===undef ? -1 : curIndx;
    }

    function getRowClass(row) {
        return row[row.length-3];
    }

    function setRowClass(row, clz) {
        row[row.length-3] = clz;
    }

    function addRowClass(row, clz) {
        row[row.length-3] += clz;
    }

    function getRowIndex(row) {
        return row[row.length-1];
    }

    function setRowIndex(row, indx) {
        row[row.length-1] = indx;
    }

    function getOrigRowIndex(row) {
        return row[row.length-2];
    }

    function getRowInfo(row) {
        return {
            data: row.slice(0, row.length-3),
            clz: row[row.length-3],
            origindx: row[row.length-2],
            curindx: row[row.length-1]
        };

    }

    function setData(table, data) {
        //Get table options
        var t = $(table);
        //Store current scroll location
        var parent = t.parent();
        t.data("editorscrollloc", {
            top: parent.scrollTop(),
            left: parent.scrollLeft()
        });
        var options = t.data("dataTablesEditorOptions");
        if (options.datachain!==undef) {
            options.datachain(table, data);
        } else {
            var dTable = t.DataTable();
            dTable.clear();
            dTable.rows.add(data);
            dTable.draw();
        }
        return table;
    }

    function createNewRow(inputs, options) {
        var ret = [];
        //Create fake row for validation
        var tr = $("<tr>");
        for (var ii=0;ii<inputs.length;ii++) {
            tr.append($("<td>").text(inputs.eq(ii).val().trim()));
        }
        var tds = tr.children();
        for (var ii=0;ii<inputs.length;ii++) {
            var val = inputs.eq(ii).val();
            if (val.length!==0) {
                var val = val.trim();
                var td = tds.eq(ii);
                var valid = validate(val, null, td, options, ii);
                if (valid.err===null) {
                    var translate = getColumnOption(options, ii, "translate");
                    if (translate!==undef) {
                        val = translate(val, td[0]).toString().trim();
                    }
                }
                ret[ret.length] = {
                    val: val,
                    err: valid.err,
                    warn: valid.warn
                };
            } else {
                ret[ret.length] = null;
            }
        }
        return ret;
    }

    function insertRow(table) {
        var options = table.data("dataTablesEditorOptions");
        var inputs = $(table.DataTable().table().header()).find(".dataTablesEditor-updateallinput");
        var row = createNewRow(inputs, options);
        if (row===null) {
            return;
        }
        for (var ii=0;ii<row.length;ii++) {
            if (row[ii]===null) {
                row[ii] = "";
            } else {
                row[ii] = row[ii].val; //Ignore any errors or warnings, the draw event will handle these when the table is redrawn
            }
        }
        addAdditionalColumns(row, "dataTablesEditor-changed dataTablesEditor-added");
        var allData = table.data("editordata");
        allData[allData.length] = row;
        //Renumber
        for (var ii=0;ii<allData.length;ii++) {
            setRowIndex(allData[ii], ii);
        }
        //Get table options
        setData(table, allData);
    }

    function allSelected(button, action) {
        var table = $($(button).data("editortable"));
        var dTable = table.DataTable();
        var rows = dTable.rows({selected: true});
        var inputsArr = null;
        if (action==="update") {
            var updateRow = $(table.DataTable().table().header()).find(".dataTablesEditor-updateallrow");
            inputsArr = createNewRow(updateRow.find(".dataTablesEditor-updateallinput"), table.data("dataTablesEditorOptions"));
            if (inputsArr===null) {
                return;
            }
            var found = false;
            for (var ii=0;ii<inputsArr.length;ii++) {
                if (inputsArr[ii]!==null) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                //Highlight the edit row
                dialogError.children("p").html("Must indicate which columns will be updated by entering values in the inputs provided.");
                dialogError.dialog({
                    dialogClass: "dataTablesEditor",
                    modal: true,
                    title: "Warning",
                    minHeight: "0px",
                    width: "auto",
                    resizable: false,
                    buttons: [
                        {text: "Ok", click: function() {$(this).dialog("close");}}
                    ]
                });
                return;
            }
        }

        if (rows.count()===0) {
            dialogError.children("p").html("You must select at least one row.");
            dialogError.dialog({
                dialogClass: "dataTablesEditor",
                modal: true,
                title: "Warning",
                minHeight: "0px",
                width: "auto",
                resizable: false,
                buttons: [
                    {text: "Ok", click: function() {$(this).dialog("close");}}
                ]
            });
            return;
        }

        allSelectedDo(action, table, rows, inputsArr);
    }

    function allSelectedDo(action, table, rows, inputsArr) {
        if (rows.count()!==0) {
            if (action==="delete") {
                var subaction = null;
                rows.every(function() {
                    var rowData = this.data();
                    var clz = getRowClass(rowData);
                    if (subaction===null) {
                        subaction = clz.indexOf("dataTablesEditor-deleted")===-1 ? "delete" : "undelete";
                    }
                    var indx = clz.indexOf("dataTablesEditor-deleted");
                    if (subaction==="delete" && indx===-1) {
                        addRowClass(rowData, (clz.length!==0 ? " " : "") + "dataTablesEditor-deleted");
                        $(this.node()).addClass("dataTablesEditor-deleted");
                    } else if (subaction==="undelete" && indx!==-1) {
                        setRowClass(rowData, (clz.substring(0, indx) + clz.substring(indx+"dataTablesEditor-deleted".length)).trim());
                        $(this.node()).removeClass("dataTablesEditor-deleted");
                    }
                });
            } else if (action==="update") {
                var add = [];
                var options = table.data("dataTablesEditorOptions");
                var origData = table.data("dataTablesEditorOrigData");
                var adjust = false;
                rows.every(function() {
                    var rowData = this.data();
                    var rowChanged = false;
                    for (var jj=0;jj<inputsArr.length;jj++) {
                        var val = inputsArr[jj];
                        if (val!==null && rowData[jj]!==val.val) {
                            //Only change if updating a non-deleted row
                            if (getRowClass(rowData).indexOf("dataTablesEditor-deleted")===-1) {
                                if (editable($(this.node()).children().eq(jj)[0], options, jj)) {
                                    rowChanged = true;
                                    rowData[jj] = val.val;
                                }
                            }
                        }
                    }
                    if (rowChanged) {
                        var origRowIndx = getOrigRowIndex(rowData);
                        setRowClass(rowData, "dataTablesEditor-changed");
                        var row = $(this.data(rowData).node());
                        row.addClass("dataTablesEditor-changed");
                        var tds = row.children().removeClass("dataTablesEditor-error dataTablesEditor-warning");
                        for (var ii=0;ii<tds.length;ii++) {
                            var td = tds.eq(ii);
                            var valid = validate(td.text(), origRowIndx!==-1 ? origData[origRowIndx][td.index()] : null, td, options, ii);
                            if (valid.err!==null) {
                                td.addClass("dataTablesEditor-error");
                            }
                            if (valid.warn!==null) {
                                td.addClass("dataTablesEditor-warning");
                            }
                        }
                        adjust = true;
                    }
                });

                if (add.length!==0) {
                    addData(table, add);
                } else if (adjust) {
                    table.DataTable().columns.adjust();
                }
            }
        }
    }

    function addData(table, add) {
        var allData = table.data("editordata");
        for (var ii=0;ii<add.length;ii++) {
            allData[allData.length] = add[ii];
        }
        for (var ii=0;ii<allData.length;ii++) {
            setRowIndex(allData[ii], ii);
        }

        //Get rows that have been selected
        var dTable = table.DataTable();
        var rows = dTable.rows({selected:true}).data();
        var arr = [];
        for (var ii=0;ii<rows.length;ii++) {
            var d = rows[ii];
            arr[arr.length] = getRowIndex(d);
        }

        //Redraw the table
        setData(table, allData);

        //Reselect the rows
        if (arr.length!==0) {
            dTable.rows().every(function() {
                var d = this.data();
                if (arr.indexOf(getRowIndex(d))!==-1) {
                    this.select();
                }
            });
        }
    }

    function resizeHeader(table) {
        var dTable = $(table).DataTable();
        var header = $(dTable.table().header());
        var updateRow = header.children(".dataTablesEditor-updateallrow");
        var updateCells = updateRow.children("th");
        var height = 0;
        var paddingAndBorder = 0;
        for (var ii=0;ii<updateCells.length;ii++) {
            var updateCell = updateCells.eq(ii);
            var updateInput = updateCell.find("textarea");
            //Format input
            var h = updateInput.outerHeight()+updateCell.outerHeight()-updateCell.height();
            var w = updateCell.width()-updateInput.outerWidth()+updateInput.width();

            var topBorder = updateCell.css("border-top-width");
            var bottomBorder = updateCell.css("border-bottom-width");
            paddingAndBorder = updateCell.innerHeight()-updateCell.height()+parseInt(topBorder.substring(0, topBorder.length-2))+parseInt(bottomBorder.substring(0, bottomBorder.length-2));

            if (h>height) {
                height = h;
            }
            updateInput.css({
                top: updateCell.css("padding-top"),
                left: updateCell.css("padding-left")
            });
            updateInput.width(w);
            //Format select
            var updateSelect = updateCell.find(".ui-selectmenu-button");
            if (updateSelect.length!==0) {
                updateSelect.css(updateCell.css(["padding-top", "padding-bottom", "padding-left", "padding-right"]));
                updateSelect.width(updateCell.innerWidth()-updateSelect.outerWidth()+updateSelect.width());
            }
        }
        updateRow.height(height);
        updateRow.find(".ui-selectmenu-button").height(height-paddingAndBorder);
    }
})();

var dataTablesColumnFilter = {};
(function(undef) {
    var dialog, dialogDivs, dialogError;
    $(window).on({
        load: function() {
            //Create dialog for column filter
            dialog = $("<form>").hide().appendTo("body");
            var div = $("<div>").appendTo(dialog);
            var input = $("<input>").attr("type", "checkbox").attr("value", "asc").uniqueId().appendTo(div);
            $("<label>").attr("for", input.attr("id")).text("Sort A to Z").appendTo(div);
            input = $("<input>").attr("type", "checkbox").attr("value", "desc").uniqueId().appendTo(div);
            $("<label>").attr("for", input.attr("id")).text("Sort Z to A").appendTo(div);
            dialog.append($("<hr>"))
                    .append($("<div>")
                    .append($("<div>").append($("<input>").attr("type", "search").attr("placeholder", "Search String...").attr("autofocus", true)))
                    .append($("<div>").css("margin", "2px 0px").text("... or ..."))
                    .append($("<div>").addClass("filter")));
            dialogDivs = dialog.children("div");

            //Redirect submit of form to the OK button
            dialog.on("submit", function() {
                $(this).siblings(".ui-dialog-buttonpane").find("button").first().trigger("click");
                return false;
            });

            //Sorting
            dialogDivs.eq(0).children("input").on("change", function() {
                var t = $(this);
                t.siblings("input").prop("checked", false);
                t.parent().buttonset("refresh");
            });

            dialogDivs.first().buttonset();

            dialogError = $("<div>").hide().appendTo("body").append($("<p>"));

        }
    });
    
    //Hide filter dialog if clicking anywhere other than a column filter element
    $(document).on("mousedown", function(event) {
        var v = $(event.target).closest(".dataTablesColumnFilter,.ui-widget-overlay");
        if (v.length===0) {
            try {dialog.dialog("close");} catch (e) {}
        }
    });

    var columnFilterTable, columnFilterTH, columnFilterButton;

    dataTablesColumnFilter.show = function(table, th) {
        var t = $(table);
        var options = t.data("dataTablesColumnFilterOptions");
        var allData = t.data("dataTablesColumnFilterData");
        var dTable = t.DataTable();
        th = $(th);
        options = getColumnOption(options, th.index());
        options = options===undef || options===null ? {} : options;

        //Do not proceed
        if (options.show===false) {
            return;
        }

        var button = th.find("button");

        //If the dialog is currently visible, and the same button is clicked, hide the dialog
        if (dialog.is(":visible")) {
            if (dialog.data("button")===button[0]) {
                dialog.dialog("close");
                return;
            }
        }
        //Set variables to be used later
        columnFilterTable = dTable;
        columnFilterTH = th;
        columnFilterButton = button;

        var indx = columnFilterTH.index(); //Where is the column in relation to the others

        //Determine if column is currently sorted
        var order = columnFilterTable.order();
        var asc = null;
        for (var ii=0;ii<order.length;ii++) {
            if (order[ii][0]===indx) {
                asc = order[ii][1];
                break;
            }
        }
        var sort = dialogDivs.eq(0).show();
        sort.children("input").prop("checked", false);
        if (asc!==null) {
            sort.children("input[value='" + asc + "']").prop("checked", true);
        }
        sort.buttonset("refresh");
        if (options.sortable===false) {
            sort.hide();
        } else {
            sort.show();
        }

        //Determine how column may be filtered

        //Determine which elements make up the checkbox filter
        var f = $(columnFilterTable.table().node()).data("dataTablesColumnFilter");

        //Find text filter if applicable
        var filterSearch = dialogDivs.eq(1).children("div").first();
        var filterText = null;
        if (options.freeformFilter===false) {
            filterSearch.hide();
        } else {
            filterSearch.show();
            for (var ii=0;ii<f.length;ii++) {
                if (f[ii][0]===indx && $.type(f[ii][1])==="string") {
                    filterText = f[ii][1];
                    break;
                }
            }
            filterSearch.children("input").val(filterText!==null ? filterText : "");
        }

        //Set checkbox filter
        var filter = dialogDivs.eq(1).children("div").last().empty();
        if (options.checkboxFilter===false) {
            filter.hide();
        } else {
            filter.show();
            var data = [];
            for (var ii=0;ii<allData.length;ii++) {
                //Is row addable
                var add = true;
                for (var jj=0;jj<f.length;jj++) {
                    var col = f[jj][0];
                    var search = f[jj][1];
                    if (f[jj][0]!==indx && f[jj][1].indexOf(allData[ii][f[jj][0]])===-1) {
                        if ($.type(search)==="string") {
                            if (allData[ii][col].toLowerCase().indexOf(search.toLowerCase())===-1) {
                                add = false;
                                break;
                            }
                        } else if (search.indexOf(allData[ii][col])===-1) {
                            add = false;
                            break;
                        }
                    }
                }
                var v = allData[ii][indx];
                if (add && data.indexOf(v)===-1) {
                    data[data.length] = v;
                }
            }
            try {
                var foundNum = false;
                data.sort(function(a, b) {
                    var an = new Number(a);
                    var bn = new Number(b);
                    var ret;
                    if (!isNaN(an) && !isNaN(bn)) {
                        ret = an-bn;
                        foundNum = true;
                    } else if (foundNum && (a.length!==0 && b.length!==0)) {
                        throw new Exception();
                    } else {
                        ret = a.localeCompare(b);
                    }
                    return ret;
                });
            } catch (e) {
                data.sort();
            }
            filter.append($("<label>").append($("<input>").attr("type", "checkbox")).append("Select All"));
            var tableColData = dTable.column(indx).data().sort().unique();
            var allChecked = true;
            $.each(data, function(j, v) {
                var checked = filterText!==null || tableColData.indexOf(v)!==-1;
                filter.append($("<label>").append($("<input>").attr("type", "checkbox").prop("checked", checked).val(v).on("change", function() {
                    var inputs = filter.find("input").slice(1);
                    filter.children("label").first().children("input").prop("checked", inputs.length===inputs.filter(":checked").length);
                })).append(v));
                if (!checked) {
                    allChecked = false;
                }
            });
            filter.children("label").first().children("input").prop("checked", allChecked).on("change", function() {
                filter.find("input").prop("checked", $(this).prop("checked"));
            });
        }

        //Find the last row of the header with the TH cell to position against
        var of = columnFilterTH.closest("thead").children().last().children().eq(indx);

        if (options.sortable===false || (options.checkboxFilter===false && options.freeformFilter===false)) {
            dialog.children("hr").hide();
        } else {
            dialog.children("hr").show();
        }

        if (options.checkboxFilter===false || options.freeformFilter===false) {
            dialogDivs.eq(1).children("div").eq(1).hide();
        } else {
            dialogDivs.eq(1).children("div").eq(1).show();
        }

        //Show dialog
        var ok = false;
        dialog.dialog({
            dialogClass: "dataTablesColumnFilter dataTablesColumnFilter-dialog",
            draggable: false,
            width: "auto",
            minHeight: "0px",
            position: {my: "right top", at: "right bottom", of: of, collision: "fit", within: table.parent()},
            resizable: false,
            beforeClose: function() {
                if (ok) {
                    //Do ordering
                    var order = columnFilterTable.order().slice(0);
                    var indx = columnFilterTH.index();
                    var sorted = sort.children("input:checked");
                    if (sorted.length!==0) {
                        var add = true;
                        for (var ii=0;ii<order.length;ii++) {
                            if (order[ii][0]===indx) {
                                order[ii][1] = sorted.val();
                                add = false;
                                break;
                            }
                        }
                        if (add) {
                            order[order.length] = [indx, sorted.val()];
                            order.sort(function(a, b) {
                                return a[0]-b[0];
                            });
                        }
                    } else {
                        for (var ii=0;ii<order.length;ii++) {
                            if (order[ii][0]===indx) {
                                order.splice(ii, 1);
                                break;
                            }
                        }
                    }
                    //Must have at least one column sorted
                    if (order.length===0) {
                        dialogError.children("p").html("<font color=red>Must sort by at least one column.</font>");
                        dialogError.dialog({
                            dialogClass: "dataTablesColumnFilter dataTablesColumnFilter-error",
                            modal: true,
                            title: "Error",
                            minHeight: "0px",
                            width: "auto",
                            resizable: false,
                            buttons: [
                                {text: "Close", click: function() {$(this).dialog("close");}}
                            ]
                        });
                        return false;
                    }
                    columnFilterTable.order(order);

                    //Compose the filter
                    var arr;
                    var search = filterSearch.children("input").val().trim();
                    if (search.length!==0) {
                        arr = search;
                    } else {
                        var vals = filter.find("input").slice(1);
                        var checkedVals = vals.filter(":checked");
                        if (vals.length===checkedVals.length) {
                            arr = true; //Remove filter, all are selected
                        } else {
                            arr = [];
                            checkedVals.each(function(i, e) {
                                arr[arr.length] = $(e).val();
                            });
                        }
                    }
                    var f = $(columnFilterTable.table().node()).data("dataTablesColumnFilter");
                    var found = false;
                    for (var ii=0;ii<f.length;ii++) {
                        if (f[ii][0]===indx) {
                            found = true;
                            if (arr===true) { //Remove the filter (all are selected)
                                f.splice(ii, 1);
                                break;
                            } else { //Set checkbox/string filter
                                f[ii][1] = arr;
                                break;
                            }
                        }
                    }
                    if (!found && arr!==true) {
                        f[f.length] = [indx, arr];
                    }

                    //Apply the filter
                    dataTablesColumnFilter.filter(table);
                }
            },
            buttons: [
                {text: "OK", click: function() {ok = true;$(this).dialog("close");}},
                {text: "Cancel", autofocus: true, click: function() {ok = false;$(this).dialog("close");}}
            ]
        });
        //Store button that caused dialog to be opened (used in beginning of this function)
        dialog.data("button", button[0]);
        return table;
    };

    dataTablesColumnFilter.filter = function(table, f) {
        var t = $(table);
        var allData = t.data("dataTablesColumnFilterData");
        if (f===undef) {
            f = t.data("dataTablesColumnFilter");;
        } else {
            t.data("dataTablesColumnFilter", f);
        }
        var dTable = t.DataTable();

        //Store current scroll location
        var parent = t.parent();
        t.data("columnfilterscrollloc", {
            top: parent.scrollTop(),
            left: parent.scrollLeft()
        });

        //Apply the filter
        dTable.clear();
        if (f.length===0) {
            dTable.rows.add(allData);
        } else {
            for (var ii=0;ii<allData.length;ii++) {
                var add = true;
                for (var jj=0;jj<f.length;jj++) {
                    var col = f[jj][0];
                    var search = f[jj][1];
                    if ($.type(search)==="string") {
                        if (allData[ii][col].toLowerCase().indexOf(search.toLowerCase())===-1) {
                            add = false;
                            break;
                        }
                    } else {
                        if (search.indexOf(allData[ii][col])===-1) {
                            add = false;
                            break;
                        }
                    }
                }
                if (add) {
                    dTable.row.add(allData[ii]);
                }
            }
        }
        setSortFilterDisplay(dTable);
        dTable.draw();
        return table;
    };

    dataTablesColumnFilter.data = function(table, data) {
        var t = $(table);
        t.data("dataTablesColumnFilterData", data);
        var options = t.data("dataTablesColumnFilterOptions");
        if (options.datachain!==undef) {
            options.datachain(table, data);
        }
        return dataTablesColumnFilter.filter(table);
    };

    dataTablesColumnFilter.config = function(table, options) {
        //Add filter array and filter buttons to header
        options = options===undef ? {} : options;
        var ltable = $(table)
            .data("dataTablesColumnFilter", [])
            .data("dataTablesColumnFilterOptions", options)
            .addClass("dataTablesColumnFilter-table")
            .on({
                "column-sizing.dt": function() {
                    var table = $(this);
                    //Prevent hidden inputs from being focused
                    table.find(".dataTablesColumnFilter-tr").find("button").attr("tabindex", -1);
                },
                "draw.dt": function() {
                    var table = $(this);
                    //Prevent hidden inputs from being focused
                    table.find(".dataTablesColumnFilter-tr").find("button").attr("tabindex", -1);
                    //Restore scroll location
                    var scroll = table.data("columnfilterscrollloc");
                    if (scroll!==undef) {
                        var parent = table.parent();
                        parent.scrollTop(scroll.top);
                        parent.scrollLeft(scroll.left);
                        table.data("columnfilterscrollloc", undef);
                    }
                },
                "init.dt": function() {
                    var table = $(this);
                    //Set initial sorting according to the column filters options
                    var options = table.data("dataTablesColumnFilterOptions");
                    var arr = [];
                    if (options.columns!==undef) {
                        for (var ii=0;ii<options.columns.length;ii++) {
                            var column = options.columns[ii];
                            if (column!==null) {
                                if (column.sort!==undef) {
                                    arr[arr.length] = [ii, column.sort];
                                }
                            }
                        }
                    }
                    if (arr.length!==0) {
                        table.DataTable().order(arr);
                    }
                }
            });
        var thead = ltable.find("thead");
        var tr = $("<tr>").addClass("dataTablesColumnFilter-tr").appendTo(thead);
        thead.children("tr").first().children("th").each(function(i) {
            var th = $("<th>").addClass("dataTablesColumnFilter-header").appendTo(tr);
            var show = getColumnOption(options, i, "show");
            if (show===undef || show===true) {
                th.append(
                        $("<div>")
                            .append($("<span>").append("A").append($("<br>")).append("Z"))
                            .append($("<span>").addClass("ui-icon ui-icon-arrowthick-1-s dataTablesColumnFilter-icon-sort")));
                $("<button>").addClass("dataTablesColumnFilter").appendTo(th).on("click", function() {
                    dataTablesColumnFilter.show(table, th[0]);
                }).button({
                    icons: {
                        primary: "ui-icon-search"
                    },
                    label: "&nbsp;",
                    text: false
                });
            }
        });
        return table;
    };

    function getColumnOption(options, indx, option) {
        if (options.columns!==undef && options.columns.length>indx) {
            var colOptions = options.columns[indx];
            if (colOptions!==null) {
                return option===undef ? colOptions : colOptions[option];
            }
        }
        return undef;
    }

    function setSortFilterDisplay(table) {
        var order = table.order();
        var f = $(table.table().node()).data("dataTablesColumnFilter");
        $(table.table().header()).find(".dataTablesColumnFilter-header").each(function(i, e) {
            e = $(e);
            var v = e.children("button");
            if (v.length===0) {
                e = e.children("div"); //Must be in another DIV
            }
            //Sort
            var v = e.children("div");
            var found = false;
            for (var ii=0;ii<order.length;ii++) {
                if (order[ii][0]===i) {
                    v.show().children("span").last().removeClass("ui-icon-arrowthick-1-s ui-icon-arrowthick-1-n").addClass(order[ii][1]==="asc" ? "ui-icon-arrowthick-1-s" : "ui-icon-arrowthick-1-n");
                    found = true;
                    break;
                }
            }
            if (!found) {
                v.hide();
            }
            //Filter
            v = e.children("button");
            found = false;
            for (var ii=0;ii<f.length;ii++) {
                if (f[ii][0]===i) {
                    v.addClass("ui-state-highlight");
                    found = true;
                    break;
                }
            }
            if (!found) {
                v.removeClass("ui-state-highlight");
            }
        });
    }
}());

var dataTablesTreeView = {};
(function(undef) {
    dataTablesTreeView.data = function(table, data) {
        var t = $(table);
        //Store current scroll location
        var parent = t.parent();
        t.data("treescrollloc", {
            top: parent.scrollTop(),
            left: parent.scrollLeft()
        });
        var options = t.data("treeoptions");
        if (options.datachain!==undef) {
            options.datachain(table, data);
        } else {
            var dTable = t.DataTable();
            dTable.clear();
            dTable.rows.add(data);
            dTable.draw();
        }
        return table;
    };
    
    function showHide(tr, expandedRows, forceHide) {
        var rows = tr.data("treerows");
        if (rows!==undef) {
            var expanded = forceHide!==false && tr.data("treeexpanded");
            $(rows).each(function(i, e) {
                var subTr = $(e);
                expanded ? subTr.show() : subTr.hide();
                showHide(subTr, expandedRows, expanded);
            });
        }
    }
    
    dataTablesTreeView.expandAll = function(table) {
        var options = $(table).data("treeoptions");
        options = options===undef ? {} : options;
        $($(table).DataTable().table().body()).children("tr").each(function(indx, e) {
            var tr = $(e);
            var rows = tr.data("treerows");
            if (rows!==undef) {
                tr.data("treeexpanded", true);
                tr.removeClass(options.expandClass);
                tr.addClass(options.collapseClass);
            }
            tr.show();
        });
    };
    
    dataTablesTreeView.collapseAll = function(table) {
        var options = $(table).data("treeoptions");
        options = options===undef ? {} : options;
        $($(table).DataTable().table().body()).children("tr").each(function(indx, e) {
            var tr = $(e);
            var rows = tr.data("treerows");
            if (rows!==undef) {
                tr.data("treeexpanded", false);
                if (tr.data("treelevel")!==0) {
                    tr.hide();
                }
                tr.removeClass(options.collapseClass);
                tr.addClass(options.expandClass);
            } else {
                tr.hide();
            }
        });
    };
    
    dataTablesTreeView.getRowData = function(tr) {
        tr = $(tr);
        return tr.parents("table").last().DataTable().row(tr[0]).data();
    };

    dataTablesTreeView.config = function(table, options) {
        options = $.extend({
            collapseClass: "dataTablesTreeView-collapse",
            expandClass: "dataTablesTreeView-expand"
        }, options);
        $(table)
            .data("treeoptions", options)
            .on({
                "draw.dt": function() {
                    var table = $(this);
                    //If table is being searched, revert to a straight view
                    if (table.DataTable().search()!=="") {
                        table.children("tbody").children("tr").each(function(i, r) {
                            $(r).show().children().each(function(i, c) {
                                var td = $(c);
                                var text = td.data("treeOriginalText");
                                if (text!==undef) {
                                    td.text(text);
                                }
                            });
                        });
                    } else {
                        //Remove values from grouped columns, and insert rows
                        var options = table.data("treeoptions");
                        var columns = options.columns===undef ? [] : options.columns;
                        var groups = [];
                        for (var ii=0;ii<columns.length;ii++) {
                            var column = columns[ii];
                            if (column!==null && column.group) {
                                groups[groups.length] = ii;
                            }
                        }
                        var head = [];
                        if (groups.length!==0) {
                            table.children("tbody").children("tr").each(function(i, r) {
                                var tr = $(r);
                                var tds = tr.children("td");
                                tds.each(function(i, c) {
                                    var indx = groups.indexOf(i);
                                    if (indx!==-1) {
                                        var td = $(c);
                                        //Get TR that will hold this row
                                        var grouptr = head[indx];
                                        var rows;
                                        var treeOriginalText = td.data("treeOriginalText");
                                        treeOriginalText = treeOriginalText===undef ? td.text() : treeOriginalText;
                                        if (grouptr===undef || grouptr.children("td").last().text()!==treeOriginalText) {
                                            rows = [];
                                            grouptr = head[indx] = $("<tr>").data("treelevel", indx).insertBefore(tr);
                                            if (i!==0) {
                                                grouptr.append($("<td>").attr("colspan", i));
                                            }
                                            if (options.expandClass) {
                                                grouptr.addClass(options.expandClass);
                                            }
                                            grouptr.append($("<td>").attr("colspan", tds.length-i).text(treeOriginalText)).data("treerows", rows).on("click", function() {
                                                var tr = $(this);
                                                var expanded = tr.data("treeexpanded");
                                                var options = tr.closest("table").data("treeoptions");
                                                options = options===undef ? {} : options;
                                                if (expanded) {
                                                    tr.removeClass(options.collapseClass);
                                                    tr.addClass(options.expandClass);
                                                    tr.data("treeexpanded", false);
                                                } else {
                                                    tr.removeClass(options.expandClass);
                                                    tr.addClass(options.collapseClass);
                                                    tr.data("treeexpanded", true);
                                                }
                                                showHide(tr);
                                            });
                                            //Add group TR to the group above it if applicable
                                            if (indx!==0) {
                                                var upperRows = head[indx-1].data("treerows");
                                                upperRows[upperRows.length] = grouptr.hide();
                                            }
                                        } else {
                                            rows = grouptr.data("treerows");
                                        }
                                        if (indx===groups.length-1) {
                                            rows[rows.length] = tr.hide();
                                        }
                                        td.data("treeOriginalText", treeOriginalText).text("");
                                    }
                                });
                            });
                        }
                    }
                    //Restore scroll location
                    var scroll = table.data("treescrollloc");
                    if (scroll!==undef) {
                        var parent = table.parent();
                        parent.scrollTop(scroll.top);
                        parent.scrollLeft(scroll.left);
                        table.data("treescrollloc", undef);
                    }
                }
            });
        return table;
    };
}());

