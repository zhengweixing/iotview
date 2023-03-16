mxConstants.STYLE_ID = "id";

mxConstants.STYLE_VISIBLE = 'visible';

mxConstants.STYLE_ONMSGARRIVED = "doMsg";
mxConstants.STYLE_ONCLICK = "onClick";

mxConstants.STYLE_MQTT_HOST = "host";
mxConstants.STYLE_MQTT_PORT = "port";
mxConstants.STYLE_MQTT_TOPICS = "topics";
mxConstants.STYLE_MQTT_SSL = "useSSL";
mxConstants.STYLE_MQTT_SESSION = "cleanSession";
mxConstants.STYLE_MQTT_KEEPALIVE = "keepAliveInterval";
mxConstants.STYLE_MQTT_TIMEOUT = "timeout";
mxConstants.STYLE_MQTT_USERNAME = "username";
mxConstants.STYLE_MQTT_PASSWORD = "password";

mxConstants.STYLE_MQTT_ONIMG = "on_img";
mxConstants.STYLE_MQTT_OFFIMG = "off_img";

mxConstants.STYLE_FORMAT = "doFormat";
mxConstants.STYLE_DATASOURCE = "dataSource";
mxConstants.STYLE_TOPIC = "dataTopic";
mxConstants.STYLE_TIMER_FREQ = "freq";

mxConstants.STYLE_ECHART_SCRIPT = "script";
mxConstants.STYLE_ECHART_GL = "gl";

Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}


var defaultCode = {
    'doFormat': function (Message) {
        var msg = JSON.parse(Message.payloadString);
        return msg;
    },
    'doMsg': function (Message) {
        if (Message.id == this.id) {
            this.setValue(Message.value);
            this.refresh();
        }
    },
    'doTimer': function (timer) {
        this.setValue(new Date().format("yyyy-MM-dd HH:mm:ss"));
        this.refresh();
    },
    'onClick': function (event) {
        console.log(this.id, event);
    },
    'getEChart': function () {
        return '//参考echart示例：https://echarts.apache.org/examples/zh/index.html\r\n' + 'option = [];\r\n' + 'this.chart.setOption(option);';
    }
};

// 消息机制
var callback = {
    editorUI: undefined,
    update_editor: function(data){
        var editorUI = callback.editorUI;
        var xml = data.view;
        var editor = editorUI.editor;
        var xmlDoc = mxUtils.parseXml(xml);
        var codec = new mxCodec(xmlDoc);
        var model = editor.graph.getModel();
        codec.decode(xmlDoc.documentElement, model);
        var change;
        var format = new mxRectangle(0, 0, model.pageWidth, model.pageHeight);
        if(model.backgroundImage){
            var image = new mxImage(model.backgroundImage, model.pageWidth, model.pageHeight);
            change = new ChangePageSetup(editorUI, null, image, format);
            change.ignoreColor = true;
        }else{
            change = new ChangePageSetup(editorUI, null, null, format);
        }
        editor.graph.model.execute(change);
    },
    bind_data: function(data){
        console.log(data);
    }
};

var sendMessage = function(msg){
   var message = msg;
   message.from = 'scene';
   window.parent.postMessage(message, "*");
}


var handleEvent = function(editorUI, data){
    try {
        if(data.from == 'iot') {
            callback.editorUI = editorUI;
            var action = data.callback;
            var Fun = callback[action];
            Fun(data);
        }
    } catch (e) {
        mxUtils.alert(mxResources.get('invalidOrMissingFile') + ': ' + e.message);
    }
}
