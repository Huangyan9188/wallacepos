/**
 * print.js is part of Wallace Point of Sale system (WPOS)
 *
 * print.js Controls rendering of print jobs and outputs them according to current settings.
 * Provides functionality for ESCP and HTML receipt output.
 *
 * WallacePOS is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3.0 of the License, or (at your option) any later version.
 *
 * WallacePOS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details:
 * <https://www.gnu.org/licenses/lgpl.html>
 *
 * @package    wpos
 * @copyright  Copyright (c) 2014 WallaceIT. (https://wallaceit.com.au)
 * @author     Michael B Wallace <micwallace@gmx.com>
 * @since      Class created 15/1/13 12:01 PM
 */

function WPOSPrint() {
    var qzdeployed = false;
    var wpdeployed = false;
    var webprint;
    var curset;
    var printmethod;
    var docmethod;
    var curprinter = null;

    this.loadPrintSettings = function () {
        loadPrintSettings();
    };

    function loadPrintSettings() {
        // load variables from local config
        curset = WPOS.getLocalConfig();
        printmethod = curset.printmethod;
        docmethod = curset.docmethod;
        //deploy qz if not deployed and print method is qz.
        if (printmethod == "qz" || docmethod == "qz") {
            if (!qzdeployed) {
                qzdeployed = true;
                deployQZ();
                alert("QZ-Print plugin has been depreciated, it's recommended that you switch to the new Web Print method.");
            }
            if (qzready == true) {
                WPOS.print.qzReady(); // setup WPOS connections
            }
            $("#printstat").show();
        } else if (printmethod == "ht" || printmethod == "wp" || docmethod == "wp") {
            if (!wpdeployed)
                deployRelayApps();
            $("#printstat").show();
        } else {
            // disable qz status
            $("#printstat").hide();
        }
        // set html option form values? This is only needed for the first load, further interaction handled by inline JS.
        setHtmlValues();
    }

    var qzready = false;
    this.qzReady = function () {
        this.printAppletReady();
        qzready = true;
    };

    this.printAppletReady = function(){
        $("#printstattxt").text("Print-App Connected");
        if (curset.printmethod=="wp"){
            webprint.requestPorts();
            webprint.requestPrinters();
        }
        // connect printer/s specified in config
        if ((curset.printmethod=="wp" || curset.printmethod=="qz") && curset.rectype == "serial" && curset.recport != "") {
            openSerialPorts();
        }
        console.log("Print Applet ready");
    };

    function disableUnsupportedMethods() {
        if (WPOS.util.mobile) {
            $(".qz-option").prop("disabled", true);
            $(".wp-option").prop("disabled", true);
        }
        // disable http printing if not android
        if (!WPOS.util.isandroid) {
            $(".ht-option").prop("disabled", true);
        }
    }

    function deployRelayApps() {
        if (WPOS.util.isandroid) {
            webprint = new AndroidWebPrint(true, WPOS.print.printAppletReady);
        } else {
            webprint = new WebPrint(true, WPOS.print.populatePortsList, WPOS.print.populatePrintersList, WPOS.print.printAppletReady);
        }
        wpdeployed = true;
    }

    function setHtmlValues() {
        disableUnsupportedMethods();
        if (printmethod == "qz" || printmethod == "wp" || printmethod == "ht") {
            $(".printoptions").show();
            // show advanced printer selection options if needed
            if (printmethod == "qz" || printmethod == "wp") {
                $(".advprintoptions").show();
                if (curset.rectype == "serial") {
                    $("#serialoptions").show();
                    $("#rawoptions").hide();
                    // set serial settings
                    $("#recport option[value='" + curset.recport + "']").prop("selected", true);
                    $("#recbaud option[value='" + curset.recbaud + "']").prop("selected", true);
                    $("#recdatabits option[value='" + curset.recdatabits + "']").prop("selected", true);
                    $("#recstopbits option[value='" + curset.recstopbits + "']").prop("selected", true);
                    $("#recparity option[value='" + curset.recparity + "']").prop("selected", true);
                } else {
                    $("#serialoptions").hide();
                    $("#rawoptions").show();
                    // set raw values
                    $("#recprinter option[value='" + curset.recprinter + "']").prop("selected", true);
                }
                $("#rectype option[value='" + curset.rectype + "']").prop("selected", true);
            } else {
                $(".advprintoptions").hide();
            }
            // set cash draw
            $(".cashdrawoptions").show();
            curset.cashdraw ? $("#cashdraw").prop("checked", true) : $("#cashdraw").prop("checked", false);
        } else {
            // browser printing, hide all options
            $(".advprintoptions").hide();
            $(".printoptions").hide();
            $(".printserviceoptions").hide();
            $(".cashdrawoptions").hide();
        }
        $("#printmethod option[value='" + curset.printmethod + "']").prop("selected", true);

        if (docmethod == "qz" || docmethod == "wp") {
            $("#docprinter").val(curset.docprinter);
            $("#docprint-options").show();
        } else {
            $("#docprint-options").hide();
        }
        $("#docmethod option[value='" + curset.docmethod + "']").prop("selected", true);

        // show service options if needed
        if (printmethod == "wp" || printmethod == "ht" || docmethod == "wp") {
            $(".printserviceoptions").show();
            $("#recip").val(curset.recip);
            $("#rectcpport").val(curset.rectcpport);
        } else {
            $(".printserviceoptions").hide();
        }
    }

    this.populatePortsList = function (ports) {
        var reclist = $('#recport');
        reclist.html('');
        if (!WPOS.getLocalConfig().hasOwnProperty('recport')){
            reclist.append('<option value="" selected></option>');
        }
        for (var p in ports) {
            reclist.append('<option ' + (WPOS.getLocalConfig().recport == ports[p] ? 'selected=selected' : '') + ' value="' + ports[p] + '">' + ports[p] + '</option>');
        }
    };

    this.populatePrintersList = function (printers) {
        var reclist = $('#recprinter');
        var doclist = $('#docprinter');
        reclist.html('');
        doclist.html('');
        if (!WPOS.getLocalConfig().hasOwnProperty('recprinter')){
            reclist.append('<option value="" selected></option>');
        }
        if (!WPOS.getLocalConfig().hasOwnProperty('docprinter')){
            doclist.append('<option value="" selected></option>');
        }
        for (var p in printers) {
            reclist.append('<option ' + (WPOS.getLocalConfig().recprinter == printers[p] ? 'selected=selected' : '') + ' value="' + printers[p] + '">' + printers[p] + '</option>');
            doclist.append('<option ' + (WPOS.getLocalConfig().docprinter == printers[p] ? 'selected=selected' : '') + ' value="' + printers[p] + '">' + printers[p] + '</option>');
        }
    };

    this.populatePrinters = function () {
        if (curset.printmethod == "wp") {
            webprint.requestPrinters();
        } else {
            populatePrinters();
        }
    };

    this.populatePorts = function () {
        if (curset.printmethod == "wp") {
            webprint.requestPorts();
        } else {
            populateSerialPorts();
        }
    };

    this.setPrintSetting = function (key, value) {
        setPrintSetting(key, value);
    };

    function setPrintSetting(key, value) {
        if (value=="")
            return;
        WPOS.setLocalConfigValue(key, value);
        loadPrintSettings(); // reload print settings, form is already updated no need to set
        if (key == "recport" || key == "recbaud" || key == "recdatabits" || key == "recstopbits" || key == "recparity" || key == "recflow" || (key == "rectype" && value == "serial")) {
            openSerialPorts();
        }
    }

    function openSerialPorts(){
        if (curset.printmethod == "wp"){
            if (curset.hasOwnProperty('recport'))
                webprint.openPort(curset.recport);
        } else {
            openSerialPort();
        }
    }

    // REPORT PRINTING
    this.printCurrentReport = function () {
        printCurrentReport();
    };

    function printCurrentReport() {
        var html;
        switch (docmethod) {
            case "br":
                browserPrintHtml($("#reportcontain").html(), true);
                break;
            case "qz":
                if (curprinter != curset.docprinter) {
                    findPrinter(curset.docprinter);
                }
                html = '<html><head><title>Wpos Report</title><link media="all" href="admin/assets/css/bootstrap.min.css" rel="stylesheet"/><link media="all" rel="stylesheet" href="admin/assets/css/font-awesome.min.css"/><link media="all" rel="stylesheet" href="admin/assets/css/ace-fonts.css"/><link media="all" rel="stylesheet" href="admin/assets/css/ace.min.css"/></head><body style="background-color: #FFFFFF;">' + $("#reportcontain").html() + '</body></html>';
                printHTML(html);
                break;
            case "wp":
                html = '<html><head><title>Wpos Report</title><link media="all" href="admin/assets/css/bootstrap.min.css" rel="stylesheet"/><link media="all" rel="stylesheet" href="admin/assets/css/font-awesome.min.css"/><link media="all" rel="stylesheet" href="admin/assets/css/ace-fonts.css"/><link media="all" rel="stylesheet" href="admin/assets/css/ace.min.css"/></head><body style="background-color: #FFFFFF;">' + $("#reportcontain").html() + '</body></html>';
                webprint.printHtml(html);
        }
    }

    // CASH DRAW
    this.openCashDraw = function (silentfail) {
        var result = openCashDraw();
        if (!silentfail)
            if (!result) {
                alert("Cash draw not connected or configured!!");
            }
    };

    function openCashDraw() {
        if (curset.cashdraw && (printmethod == "qz" || printmethod == "ht" || printmethod == "wp")) {
            if ((printmethod == "qz" || printmethod == "wp") && (curset.recprinter == null && curset.recport == null)) {
                return false;
            }
            return sendESCPPrintData(esc_init + esc_p + "\x32" + "\x32");
        } else {
            return false;
        }
    }

    // RECEIPT PRINTING
    this.printArbReceipt = function (text) {
        switch (printmethod) {
            case "br":
                browserPrintHtml("<pre style='text-align: center; background-color: white;'>" + text + "</pre>", false);
                return true;
            case "qz":
            case "ht":
            case "wp":
                sendESCPPrintData(esc_a_c + text + "\n\n\n\n" + gs_cut + "\r");
                return true;
            default :
                return false;
        }
    };

    this.printReceipt = function (ref) {
        printReceipt(ref);
    };

    function printReceipt(ref) {
        var record = WPOS.trans.getTransactionRecord(ref);

        switch (printmethod) {
            case "br":
                browserPrintHtml(getHtmlReceipt(record), false);
                return true;
            case "qz":
            case "ht":
            case "wp":
                var data = getEscReceipt(record);
                if (WPOS.getConfigTable().pos.recprintlogo == true) {
                    getESCPImageString("https://" + document.location.hostname + WPOS.getConfigTable().pos.reclogo, function (imgdata) {
                        appendQrcode(imgdata + data);
                    });
                } else {
                    appendQrcode(data);
                }
                return true;

            default :
                return false;
        }
    }

    this.testReceiptPrinter = function () {
        if (printmethod == "qz" || printmethod == "ht" || printmethod == "wp") {
            testReceipt();
        } else {
            alert("Receipt printer not configured!");
        }
    };

    function testReceipt() {
        var data = getEscReceiptHeader() + "\n\n\n\n" + gs_cut + "\r";
        getESCPImageString("https://" + document.location.hostname + WPOS.getConfigTable().pos.reclogo, function (imgdata) {
            sendESCPPrintData(imgdata + data);
        });
    }

    this.printQrCode = function () {
        appendQrcode("");
    };

    function appendQrcode(data) {
        if (WPOS.getConfigTable().pos.recqrcode != "") {
            getESCPImageString("https://" + document.location.hostname + "/docs/qrcode.png", function (imgdata) {
                sendESCPPrintData(data + imgdata + "\n\n\n\n" + gs_cut + "\r");
            });
        } else {
            sendESCPPrintData(data + "\n\n\n\n" + gs_cut + "\r");
        }
    }

    function sendESCPPrintData(data) {
        switch (printmethod) {
            case "qz":
                if (curset.rectype == "serial") {
                    sendSerialData(btoa(data));
                } else {
                    // set qz printer
                    if (curprinter != curset.recprinter) {
                        findPrinter(curset.recprinter);
                    }
                    qz.append64(btoa(data)); // append the data
                    qz.print();
                }
                return true;
            case "wp":
                if (curset.rectype == "serial"){
                    webprint.printSerial(btoa(data), curset.recport);
                } else {
                    webprint.printRaw(btoa(data), curset.recprinter);
                }
                return true;
            case "ht":
                webprint.print(data);
                return true;
        }
        return false;
    }

    // android print app methods
    var AndroidWebPrint = function (init, readyCb) {

        this.print = function (data) {
            if (!pwindow || pwindow.closed) {
                openPrintWindow();
                setTimeout(function () {
                    sendData(data);
                }, 220);
            }
            sendData(data);
        };

        function sendData(data) {
            pwindow.postMessage(encodeURIComponent(data), "*");
            console.log(data);
        }

        var pwindow;

        function openPrintWindow() {
            pwindow = window.open("http://" + curset.recip + ":" + curset.rectcpport + "/printwindow", 'AndroidPrintService');
            if (pwindow)
                pwindow.blur();
            window.focus();
        }

        var timeOut;
        this.checkRelay = function () {
            if (pwindow && pwindow.open) {
                pwindow.close();
            }
            window.addEventListener("message", message, false);
            openPrintWindow();
            timeOut = setTimeout(dispatchAndroid, 2000);
        };

        function message(event) {
            if (event.origin != "http://" + curset.recip + ":" + curset.rectcpport)
                return;
            if (event.data == "init") {
                clearTimeout(timeOut);
                readyCb();
                alert("The Android print service has been loaded in a new tab, keep it open for faster printing.");
            }
        }

        function dispatchAndroid() {
            var answer = confirm("Would you like to open/install the printing app?");
            if (answer) {
                document.location.href = "https://wallaceit.com.au/playstore/httpsocketadaptor/index.php";
            }
        }

        if (init) this.checkRelay();
        return this;
    };

    // web print methods
    var WebPrint = function (init, defPortCb, defPrinterCb, defReadyCb) {

        this.printRaw = function (data, printer) {
            var request = {a: "printraw", data: data, printer: printer};
            sendAppletRequest(request);
        };

        this.printSerial = function (data, port) {
            var request = {a: "printraw", data: data, port: port};
            sendAppletRequest(request);
        };

        this.printHtml = function (data, printer) {
            var request = {a: "printhtml", printer: printer, data: data};
            sendAppletRequest(request);
        };

        this.openPort = function (port) {
            var request = {a: "openport", port: port, settings: {baud: curset.recbaud, databits: curset.recdatabits, stopbits: curset.recstopbits, parity: curset.recparity, flow: curset.recflow}};
            sendAppletRequest(request);
        };

        this.requestPrinters = function () {
            sendAppletRequest({a: "listprinters"});
        };

        this.requestPorts = function () {
            sendAppletRequest({a: "listports"});
        };

        function sendAppletRequest(data) {
            data.cookie = cookie;
            if (!wpwindow || wpwindow.closed || !wpready) {
                if (wpready){
                    console.log("Print window not detected as open...reopening window");
                    openPrintWindow();
                } else {
                    console.log("Print applet connection not established...trying to reconnect");
                    webprint.checkRelay();
                }
                setTimeout(function () {
                    wpwindow.postMessage(JSON.stringify(data), "*");
                }, 250);
            }
            wpwindow.postMessage(JSON.stringify(data), "*");
        }

        var wpwindow;
        var wpready = false;
        function openPrintWindow() {
            wpready = false;
            wpwindow = window.open("http://" + curset.recip + ":" + curset.rectcpport + "/printwindow", 'WebPrintService');
            if (wpwindow)
                wpwindow.blur();
            window.focus();
        }

        var wptimeOut;
        this.checkRelay = function () {
            $("#printstattxt").text("Initializing...");
            if (wpwindow && !wpwindow.closed) {
                wpwindow.close();
            }
            window.addEventListener("message", handleWebPrintMessage, false);
            openPrintWindow();
            wptimeOut = setTimeout(dispatchWebPrint, 2000);
        };

        function handleWebPrintMessage(event) {
            if (event.origin != "http://" + curset.recip + ":" + curset.rectcpport)
                return;
            switch (event.data.a) {
                case "init":
                    clearTimeout(wptimeOut);
                    wpready = true;
                    sendAppletRequest({a:"init"});
                    break;
                case "response":
                    var response = JSON.parse(event.data.json);
                    if (response.hasOwnProperty('ports')) {
                        if (defPortCb instanceof Function) defPortCb(response.ports);
                    } else if (response.hasOwnProperty('printers')) {
                        if (defPrinterCb instanceof Function)  defPrinterCb(response.printers);
                    } else if (response.hasOwnProperty('error')) {
                        alert(response.error);
                    }
                    if (response.hasOwnProperty("cookie")){
                        cookie = response.cookie;
                        localStorage.setItem("webprint_auth", response.cookie);
                    }
                    if (response.hasOwnProperty("ready")){
                        if (defReadyCb instanceof Function) defReadyCb();
                    }
                    break;
                case "error": // cannot contact print applet from relay window
                    webprint.checkRelay();

            }
            //alert("The Web Printing service has been loaded in a new tab, keep it open for faster printing.");
        }

        function dispatchWebPrint() {
            $("#printstattxt").text("Print-App Error");
            var answer = confirm("Cannot communicate with the printing app.\nWould you like to open/install the printing app?");
            var dlframe = $("#dlframe");
            dlframe.attr("src", "");
            if (answer) {
                //window.open("/assets/libs/WebPrint.jar", '_blank');
                dlframe.attr("src", "/assets/libs/WebPrint.jar");
            }
        }

        var cookie = localStorage.getItem("webprint_auth");
        if (cookie==null){
            cookie = "";
        }
        if (init) this.checkRelay();

        return this;
    };

    // ESC/P receipt generation
    var esc_init = "\x1B" + "\x40"; // initialize printer
    var esc_p = "\x1B" + "\x70" + "\x30"; // open drawer
    var gs_cut = "\x1D" + "\x56" + "\x4E"; // cut paper
    var esc_a_l = "\x1B" + "\x61" + "\x30"; // align left
    var esc_a_c = "\x1B" + "\x61" + "\x31"; // align center
    var esc_a_r = "\x1B" + "\x61" + "\x32"; // align right
    var esc_double = "\x1B" + "\x21" + "\x31"; // heading
    var font_reset = "\x1B" + "\x21" + "\x02"; // styles off
    var esc_ul_on = "\x1B" + "\x2D" + "\x31"; // underline on
    var esc_bold_on = "\x1B" + "\x45" + "\x31"; // emphasis on
    var esc_bold_off = "\x1B" + "\x45" + "\x30"; // emphasis off

    function getEscReceiptHeader() {
        var bizname = WPOS.getConfigTable().general.bizname;
        var recval = WPOS.getConfigTable().pos;
        // header
        var header = esc_init + esc_a_c + esc_double + bizname + "\n" + font_reset +
            esc_bold_on + recval.recline2 + "\n";
        if (recval.recline3 != "") {
            header += recval.recline3 + "\n";
        }
        header += "\n" + esc_bold_off;
        return header;
    }

    function getEscReceipt(record) {
        // send cash draw command to the printer
        // header
        var cmd = getEscReceiptHeader();
        // transdetails
        cmd += esc_a_l + "Transaction Ref: " + record.ref + "\n";
        cmd += "Sale Time:       " + WPOS.util.getDateFromTimestamp(record.processdt) + "\n\n";
        // items
        var leftstr, rightstr, item;
        for (var i in record.items) {
            item = record.items[i];
            cmd += getEscTableRow(item.qty + " x " + item.name + " (" + WPOS.currency() + item.unit + ")", WPOS.currency() + item.price, false, false);
        }
        cmd += '\n';
        // totals
        // subtotal
        if (Object.keys(record.taxdata).length > 0 || record.discount > 0) { // only add if discount or taxes
            cmd += getEscTableRow('Subtotal:', WPOS.currency() + record.subtotal, true, false);
        }
        // taxes
        var taxstr;
        for (i in record.taxdata) {
            taxstr = WPOS.getTaxTable()[i];
            taxstr = taxstr.name + ' (' + taxstr.value + '%)';
            cmd += getEscTableRow(taxstr, WPOS.currency() + record.taxdata[i], false, false);
        }
        // discount
        cmd += (record.discount > 0 ? getEscTableRow(record.discount + '% Discount', WPOS.currency() + Math.abs(parseFloat(record.total) - (parseFloat(record.subtotal) + parseFloat(record.tax))).toFixed(2), false, false) : '');
        // grand total
        cmd += getEscTableRow('Total (' + record.numitems + ' item' + (record.numitems > 1 ? 's)' : ')') + ':', WPOS.currency() + record.total, true, true);
        // payments
        var paymentreceipts = '';
        var method, amount;
        for (i in record.payments) {
            item = record.payments[i];
            method = item.method;
            amount = item.amount;
            // check for extra payment data
            if (item.hasOwnProperty('paydata')) {
                // check for integrated eftpos receipts
                if (item.paydata.hasOwnProperty('customerReceipt')) {
                    paymentreceipts += item.paydata.customerReceipt + '\n';
                }
                // catch cash-outs
                if (item.paydata.hasOwnProperty('cashOut')) {
                    method = "cashout";
                    amount = (-amount).toFixed(2);
                }
            }
            cmd += getEscTableRow(WPOS.util.capFirstLetter(method) + ':', WPOS.currency() + amount, false, false);
            if (method == 'cash') { // If cash print tender & change
                cmd += getEscTableRow('Tendered:', WPOS.currency() + item.tender, false, false);
                cmd += getEscTableRow('Change:', WPOS.currency() + item.change, false, false);
            }
        }
        cmd += '\n';
        // refunds
        if (record.hasOwnProperty("refunddata")) {
            cmd += esc_a_c + esc_bold_on + 'Refund' + font_reset + '\n';
            var lastrefindex = 0, lastreftime = 0;
            for (i in record.refunddata) {
                // find last refund for integrated eftpos receipt
                if (record.refunddata[i].processdt > lastreftime) {
                    lastrefindex = i;
                }
                cmd += getEscTableRow((WPOS.util.getDateFromTimestamp(record.refunddata[i].processdt) + ' (' + record.refunddata[i].items.length + ' items)'), (WPOS.util.capFirstLetter(record.refunddata[i].method) + '     ' + WPOS.currency() + record.refunddata[i].amount), false, false);
            }
            cmd += '\n';
            // check for integrated receipt and replace if found
            if (record.refunddata[lastrefindex].hasOwnProperty('paydata') && record.refunddata[lastrefindex].paydata.hasOwnProperty('customerReceipt')) {
                paymentreceipts = record.refunddata[lastrefindex].paydata.customerReceipt + '\n';
            }
        }
        // void sale
        if (record.hasOwnProperty("voiddata")) {
            cmd += esc_a_c + esc_double + esc_bold_on + 'VOID TRANSACTION' + font_reset + '\n';
            cmd += '\n';
        }
        // add integrated eftpos receipts
        if (paymentreceipts != '' && WPOS.getLocalConfig().eftpos.receipts) cmd += esc_a_c + paymentreceipts;
        // footer
        cmd += esc_bold_on + esc_a_c + WPOS.getConfigTable().pos.recfooter + font_reset + "\r";

        return cmd;
    }

    function getEscTableRow(leftstr, rightstr, bold, underline) {
        var pad = "";
        if (leftstr.length + rightstr.length > 48) {
            var clip = (leftstr.length + rightstr) - 48; // get amount to clip
            leftstr = leftstr.substring(0, (leftstr.length - (clip + 3)));
            pad = ".. ";
        } else {
            var num = 48 - (leftstr.length + rightstr.length);
            for (num; num > 0; num--) {
                pad += " ";
            }
        }
        var row = leftstr + pad + (underline ? esc_ul_on : '') + rightstr + (underline ? font_reset : '') + "\n";
        if (bold) { // format row
            row = esc_bold_on + row + esc_bold_off;
        }
        return row;
    }

    function getESCPImageString(url, callback) {
        img = new Image();
        img.onload = function () {
            // Create an empty canvas element
            //var canvas = document.createElement("canvas");
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            // Copy the image contents to the canvas
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            // get image slices and append commands
            var bytedata = esc_init + esc_a_c + getESCPImageSlices(ctx, canvas) + font_reset;
            //alert(bytedata);
            callback(bytedata);
        };
        img.src = url;
    }

    function getESCPImageSlices(context, canvas) {
        var width = canvas.width;
        var height = canvas.height;
        var nL = Math.round(width % 256);
        var nH = Math.round(height / 256);
        var dotDensity = 33;
        // read each pixel and put into a boolean array
        var imageData = context.getImageData(0, 0, width, height);
        imageData = imageData.data;
        // create a boolean array of pixels
        var pixArr = [];
        for (var pix = 0; pix < imageData.length; pix += 4) {
            pixArr.push((imageData[pix] == 0));
        }
        // create the byte array and buffer; could use Uint8ClampedArray when available for optimization
        //var buf = new ArrayBuffer(pixArr.length);
        //var final = new Uint8ClampedArray(buf);
        //var fi = 0;
        var final = [];
        // this function adds bytes to the array
        function appendBytes() {
            for (var i = 0; i < arguments.length; i++) {
                final.push(arguments[i]);
                //final[fi] = arguments[i];
                //fi++;
            }
        }

        // Set the line spacing to 24 dots, the height of each "stripe" of the image that we're drawing.
        appendBytes(0x1B, 0x33, 24);
        // Starting from x = 0, read 24 bits down. The offset variable keeps track of our global 'y'position in the image.
        // keep making these 24-dot stripes until we've executed past the height of the bitmap.
        var offset = 0;
        while (offset < height) {
            // append the ESCP bit image command
            appendBytes(0x1B, 0x2A, dotDensity, nL, nH);
            for (var x = 0; x < width; ++x) {
                // Remember, 24 dots = 24 bits = 3 bytes. The 'k' variable keeps track of which of those three bytes that we're currently scribbling into.
                for (var k = 0; k < 3; ++k) {
                    var slice = 0;
                    // The 'b' variable keeps track of which bit in the byte we're recording.
                    for (var b = 0; b < 8; ++b) {
                        // Calculate the y position that we're currently trying to draw.
                        var y = (((offset / 8) + k) * 8) + b;
                        // Calculate the location of the pixel we want in the bit array. It'll be at (y * width) + x.
                        var i = (y * width) + x;
                        // If the image (or this stripe of the image)
                        // is shorter than 24 dots, pad with zero.
                        var bit;
                        if (pixArr.hasOwnProperty(i)) bit = pixArr[i] ? 0x01 : 0x00; else bit = 0x00;
                        // Finally, store our bit in the byte that we're currently scribbling to. Our current 'b' is actually the exact
                        // opposite of where we want it to be in the byte, so subtract it from 7, shift our bit into place in a temp
                        // byte, and OR it with the target byte to get it into the final byte.
                        slice |= bit << (7 - b);    // shift bit and record byte
                    }
                    // Phew! Write the damn byte to the buffer
                    appendBytes(slice);
                }
            }
            // We're done with this 24-dot high pass. Render a newline to bump the print head down to the next line and keep on trucking.
            offset += 24;
            appendBytes(10);
        }
        // Restore the line spacing to the default of 30 dots.
        appendBytes(0x1B, 0x33, 30);
        // convert the array into a bytestring and return
        final = WPOS.util.utf8ArrayToStr(final);

        return final;
    }

    function getHtmlReceipt(record) {
        var bizname = WPOS.getConfigTable().general.bizname;
        var recval = WPOS.getConfigTable().pos;
        // logo and header
        var html = '<div style="padding-left: 5px; padding-right: 5px; text-align: center;"><img style="width: 260px;" src="' + recval.recemaillogo + '"/><br/>';
        html += '<h3 style="text-align: center; margin: 5px;">' + bizname + '</h3>';
        html += '<p style="text-align: center"><strong>' + recval.recline2 + '</strong>';
        if (recval.recline3 != "") {
            html += '<br/><strong style="text-align: center">' + recval.recline3 + '</strong>';
        }
        html += '</p>';
        // body
        html += '<p style="padding-top: 5px;">Transaction Ref:&nbsp;&nbsp;' + record.ref + '<br/>';
        html += 'Sale Time:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + WPOS.util.getDateFromTimestamp(record.processdt) + '</p>';
        // items
        html += '<table style="width: 100%; margin-bottom: 4px; font-size: 13px;">';
        var item;
        for (var i in record.items) {
            item = record.items[i];
            html += '<tr><td>' + item.qty + "x " + item.name + " (" + WPOS.currency() + item.unit + ")" + '</td><td style="text-align: right;">' + WPOS.currency() + item.price + '</td></tr>';
        }
        html += '<tr style="height: 5px;"><td></td><td></td></tr>';
        // totals
        // subtotal
        if (Object.keys(record.taxdata).length > 0 || record.discount > 0) { // only add if discount or taxes
            html += '<tr><td><b>Subtotal: </b></td><td style="text-align: right;"><b style="text-decoration: overline;">' + WPOS.currency() + record.subtotal + '</b></td></tr>';
        }
        // taxes
        var taxstr;
        for (i in record.taxdata) {
            taxstr = WPOS.getTaxTable()[i];
            taxstr = taxstr.name + ' (' + taxstr.value + '%)';
            html += '<tr><td>' + taxstr + ':</td><td style="text-align: right;">' + WPOS.currency() + record.taxdata[i] + '</td></tr>';
        }
        // discount
        html += (record.discount > 0 ? '<tr><td>' + record.discount + '% Discount</td><td style="text-align: right;">' + WPOS.currency() + Math.abs(parseFloat(record.total) - (parseFloat(record.subtotal) + parseFloat(record.tax))).toFixed(2) + '</td></tr>' : '');
        // grand total
        html += '<tr><td><b>Total (' + record.numitems + ' items): </b></td><td style="text-align: right;"><b style="text-decoration: overline;">' + WPOS.currency() + record.total + '</b></td></tr>';
        html += '<tr style="height: 2px;"><td></td><td></td></tr>';
        // payments
        var paymentreceipts = '';
        var method, amount;
        for (i in record.payments) {
            item = record.payments[i];
            method = item.method;
            amount = item.amount;
            // check for special payment values
            if (item.hasOwnProperty('paydata')) {
                // check for integrated eftpos receipts
                if (item.paydata.hasOwnProperty('customerReceipt')) {
                    paymentreceipts += item.paydata.customerReceipt;
                }
                // catch cash-outs
                if (item.paydata.hasOwnProperty('cashOut')) {
                    method = "cashout";
                    amount = (-amount).toFixed(2);
                }
            }
            html += '<tr><td>' + WPOS.util.capFirstLetter(method) + ':</td><td style="text-align: right;">' + WPOS.currency() + amount + '</td></tr>';
            if (method == 'cash') {
                // If cash print tender & change.
                html += '<tr><td>Tendered:</td><td style="text-align: right;">' + WPOS.currency() + item.tender + '</td></tr>';
                html += '<tr><td>Change:</td><td style="text-align: right;">' + WPOS.currency() + item.change + '</td></tr>';
            }

        }
        html += '</table>';
        // refunds
        if (record.hasOwnProperty("refunddata")) {
            html += '<p style="margin-top: 0px; margin-bottom: 5px; font-size: 13px;"><strong>Refund</strong></p><table style="width: 100%; font-size: 13px;">';
            var lastrefindex = 0, lastreftime = 0;
            for (i in record.refunddata) {
                // find last refund for integrated eftpos receipt
                if (record.refunddata[i].processdt > lastreftime) {
                    lastrefindex = i;
                }
                html += '<tr><td>' + WPOS.util.getDateFromTimestamp(record.refunddata[i].processdt) + ' (' + record.refunddata[i].items.length + ' items)</p></td><td><p style="font-size: 13px; display: inline-block;">' + WPOS.util.capFirstLetter(record.refunddata[i].method) + '</p><p style="font-size: 13px; display: inline-block; float: right;">' + WPOS.currency() + record.refunddata[i].amount + '</td></tr>';
            }
            html += '</table>';
            // check for integrated receipt and replace if found
            if (record.refunddata[lastrefindex].hasOwnProperty('paydata') && record.refunddata[lastrefindex].paydata.hasOwnProperty('customerReceipt')) {
                paymentreceipts = record.refunddata[lastrefindex].paydata.customerReceipt;
            }
        }
        // void sale
        if (record.hasOwnProperty("voiddata")) {
            html += '<h2 style="text-align: center; color: #dc322f; margin-top: 5px;">VOID TRANSACTION</h2>';
        }
        // add integrated eftpos receipts
        if (paymentreceipts != '' && WPOS.getLocalConfig().eftpos.receipts) html += '<pre style="text-align: center; background-color: white;">' + paymentreceipts + '</pre>';
        // footer
        html += '<p style="text-align: center;"><strong>' + recval.recfooter + '</strong><br/>';
        if (recval.recqrcode != "") {
            html += '<img style="text-align: center;" height="99" src="/docs/qrcode.png"/>';
        }
        html += '</p></div>';
        return html;
    }

    // Browser printing methods
    function browserPrintHtml(html, isreport) {
        var printw;
        if (isreport == true) {
            printw = window.open('', 'Wpos Report', 'height=800,width=600,scrollbars=yes');
            printw.document.write('<html><head><title>Wpos Report</title>');
        } else {
            printw = window.open('', 'Wpos Receipt', 'height=600,width=300,scrollbars=yes');
            printw.document.write('<html><head><title>Wpos Receipt</title>');
        }
        printw.document.write('<link media="all" href="/admin/assets/css/bootstrap.min.css" rel="stylesheet"/><link media="all" rel="stylesheet" href="/admin/assets/css/font-awesome.min.css"/><link media="all" rel="stylesheet" href="admin/assets/css/ace-fonts.css"/><link media="all" rel="stylesheet" href="admin/assets/css/ace.min.css"/>');
        printw.document.write('</head><body style="background-color: #FFFFFF;">');
        printw.document.write(html);
        printw.document.write('</body></html>');
        printw.document.close();

        // close only after printed, This is only implemented properly in firefox but can be used for others soon (part of html5 spec)
        if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
            printw.addEventListener('afterprint', function(e){ printw.close(); });

        printw.focus();
        printw.print();
    }
}
