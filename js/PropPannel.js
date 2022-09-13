function baseProp(id, title, opts) {
    this.id = id;
    opts = opts ? opts : {};
    var required = opts.required ? opts.required : false;
    this.setRequired = function (Required) {
        required = Required
    }

    this.submit = function () {
        var value = this.getValue();
        if (required) {
            if (!value || value == '') {
                throw  title + " is required!";
            }
        }
        if (opts.type && opts.type == 'base64') {
            value = Base64.encode(value);
        }
        return value;
    }

    opts.default = opts.default ? opts.default : '';
    opts.className = opts.className ? opts.className : '';
    this.init = function (view, container, index) {
        if (index == 0) {
            opts.className += ' input-box-0';
        }
        var div = document.createElement("div");
        div.className = "input-row";

        var value = view.getValue(id, null);
        if (value && opts.type && opts.type == 'base64') {
            value = Base64.decode(value);
        }
        if (!value) {
            value = opts.default;
        }
        this.create(div, value, title, opts);
        container.appendChild(div);
    }
}

baseProp.prototype.create = function (div, value, title, opts) {
}

baseProp.prototype.getValue = function () {
    var element = document.getElementById(this.id);
    switch (element.type.toLowerCase()) {
        case 'submit':
        case 'hidden':
        case 'password':
        case 'text':
        case 'textarea':
        case 'select-one':
            return element.value;
        case 'checkbox':
        case 'radio':
            return element.checked;
    }
}

// input
function inputProp(id, title, help, className) {
    baseProp.call(this, id, title, help, className);
}

inputProp.prototype = Object.create(baseProp.prototype);

inputProp.prototype.create = function (div, value, title, opts) {
    var html =
        '<div class="input-box ' + opts.className + '">' +
        '  <div class="input-span">' + title + '</div>' +
        '  <input id="' + this.id + '" type="text" placeholder="请输入' + title + '" value="' + value + '" />' +
        '</div>';
    div.innerHTML = html;
}

// checkBox
function checkBoxProp(id, title, opts) {
    baseProp.call(this, id, title, opts);
}

checkBoxProp.prototype = Object.create(baseProp.prototype);

checkBoxProp.prototype.create = function (div, value, title, opts) {
    value = value == 'true' ? 'checked=checked' : '';
    var html =
        '<div class="input-box ' + opts.className + '">' +
        '  <div class="input-span">' + title + '</div>' +
        '  <input class="input-check" id="' + this.id + '" type="checkbox" ' + value + ' />' +
        '</div>';
    div.innerHTML = html;
}


// textarea
function textareaProp(id, title, rows, opts) {
    this.rows = rows;
    baseProp.call(this, id, title, opts);
}

textareaProp.prototype = Object.create(baseProp.prototype);

textareaProp.prototype.create = function (div, value, title, opts) {
    var html =
        '<div class="input-box ' + opts.className + '">' +
        '  <div style="border-width: 0px;width:100%; padding-top:8px; padding-bottom:8px;" class="input-span">' + title + '</div>' +
        '  <div style="padding:5px 10px 5px 5px;">' +
        '    <textarea style="border-color:#b4adad;"  rows="' + this.rows + '" id="' + this.id + '" placeholder="请输入' + title + '">' + value + '</textarea>' +
        '  </div>' +
        '</div>';
    div.innerHTML = html;
}


//select
function selectProp(id, title, opts) {
    baseProp.call(this, id, title, opts);
}

selectProp.prototype = Object.create(baseProp.prototype);


selectProp.prototype.create = function (div, value, title, opts) {
    var items = opts.items ? opts.items : [];
    var html =
        '<div class="input-box ' + opts.className + '">' +
        '  <div class="input-span">' + title + '</div>' +
        '  <select id="' + this.id + '">';
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var selected = value == item.value ? "selected" : "";
        html += '<option value="' + item.value + '" ' + selected + '>' + item.title + '</option>';
    }
    html +=
        '  </select>' +
        '</div>';
    div.innerHTML = html;
}

// 属性展示面板渲染器
var propRender = {

    views: new Object(),
    register: function (Type, Class) {
        this.views[Type] = Class;
    },

    getPropView: function (container, graph, cell) {
        var state = graph.view.getState(cell);
        var PropView = this.views[state.style.shape];
        if (!PropView) {
            PropView = this.views['default'];
        }
        var propView = new PropView(container, graph, cell);
        propView.cell = cell;
        return propView;
    },

    init: function (container, graph) {
        var cells = graph.getSelectionCells();
        if (cells != null && cells.length > 0) {
            var cell = cells[0];
            return this.getPropView(container, graph, cell);
        }
    }
}

// 属性展示面板
function BasePropView(container, graph, cell) {
    this.graph = graph;
    this.state = graph.view.getState(cell);
    this.required = this.required ? this.required : [];

    var baseProps = [
        {
            title: "基本属性",
            items: [
                new inputProp(mxConstants.STYLE_ID, "ID")
            ]
        }
    ];
    this.initProp();
    if (this.props) {
        this.props = baseProps.concat(this.props);
    } else {
        this.props = baseProps
    }

    for (var i = 0; i < this.props.length; i++) {
        var prop = this.props[i];
        var subtitle = document.createElement("div");
        subtitle.className = "subtitle";
        if (prop.help) {
            subtitle.innerHTML = prop.title + '<span class="glyphicon glyphicon-search"></span><a href="/resources/help_zh.html#' + prop.help + '" target="_blank"  class="help_link">?</a>';
        } else{
            subtitle.innerHTML = prop.title;
        }
        container.appendChild(subtitle);
        for (var idx = 0; idx < prop.items.length; idx++) {
            var item = prop.items[idx];
            if (this.required.indexOf(item.id) >= 0) {
                item.setRequired(true);
            }
            item.init(this, container, idx);
        }
    }
}

BasePropView.prototype.initProp = function () {

}

BasePropView.prototype.getValue = function (id, defaultValue) {
    return mxUtils.getValue(this.state.style, id, defaultValue);
}

BasePropView.prototype.save = function (id, value, cells) {
    this.graph.setCellStyles(id, value, cells);
}

BasePropView.prototype.onSubmit = function () {
    var arr = [];
    for (var i = 0; i < this.props.length; i++) {
        var props = this.props[i];
        for (var j = 0; j < props.items.length; j++) {
            var prop = props.items[j];
            prop.value = prop.submit();
            arr.push(prop);
        }
    }
    var cells = this.graph.getSelectionCells();
    for(var i = 0; i < arr.length; i++){
        var prop = arr[i];
        this.save(prop.id, prop.value, cells);
    }
}

function MqttPropView(container, graph, cell) {
    this.required = [
        mxConstants.STYLE_ID,
        mxConstants.STYLE_MQTT_HOST,
        mxConstants.STYLE_MQTT_PORT
    ];
    BasePropView.call(this, container, graph, cell);
}

MqttPropView.prototype = Object.create(BasePropView.prototype);

propRender.register('mqtt', MqttPropView);

MqttPropView.prototype.initProp = function () {
    this.props = [
        {
            title: "MQTT参数",
            help: "mqtt",
            items: [
                new inputProp(mxConstants.STYLE_MQTT_HOST, "服务器", {default: "127.0.0.1"}),
                new inputProp(mxConstants.STYLE_MQTT_PORT, "端口", {default: "8083"}),
                new inputProp(mxConstants.STYLE_MQTT_USERNAME, "用户名", {}),
                new inputProp(mxConstants.STYLE_MQTT_PASSWORD, "密码", {}),
                new inputProp(mxConstants.STYLE_MQTT_KEEPALIVE, "心跳", {default: "60"}),
                new inputProp(mxConstants.STYLE_MQTT_TIMEOUT, "超时", {default: "10"}),
                new checkBoxProp(mxConstants.STYLE_MQTT_SSL, "SSL", {default: "false"}),
                new checkBoxProp(mxConstants.STYLE_MQTT_SESSION, "清除会话", {default: "true"})
                // new textareaProp(mxConstants.STYLE_MQTT_TOPICS, "订阅主题", 5,{})
            ]
        },
        {
            title: "连接状态",
            help: "status",
            items: [
                new checkBoxProp(mxConstants.STYLE_VISIBLE, "是否显示", {default: "true"}),
                new inputProp(mxConstants.STYLE_MQTT_OFFIMG, "断开", {default: "shapes/1/20.png"}),
                new inputProp(mxConstants.STYLE_MQTT_ONIMG, "连接", {default: "shapes/1/14.png"})
            ]
        }
        // {
        //     title: "消息格式化",
        //     help: "doFormat",
        //     items: [
        //         new textareaProp(mxConstants.STYLE_FORMAT, "处理函数", 10, {
        //             type: "base64",
        //             default: doFormat.toString()
        //         })
        //     ]
        // }
    ];
}


// 显示控件
function ShapePropView(container, graph, cell) {
    BasePropView.call(this, container, graph, cell);
}

ShapePropView.prototype = Object.create(BasePropView.prototype);

propRender.register('default', ShapePropView);


ShapePropView.prototype.initProp = function () {
    var dataSource = [{title: 'NONE', value: '', topics: []}];
    var Graph = this.graph;
    loopCell(Graph, function (cell) {
        var state = Graph.view.getState(cell);
        var id = mxUtils.getValue(state.style, mxConstants.STYLE_ID, null);
        if (id && state.shape.type == 'dataSource') {
            var ShapeType = state.style.shape.toUpperCase();
            var item = {
                title: '[' + ShapeType + '] ' + id,
                value: id
            };
            if (ShapeType == 'MQTT'){
                var topics = state.style.topics ? state.style.topics : '';
                item.topics = topics.split("\n");
            }
            dataSource.push(item);
        }
    });
    this.props = [
        {
            title: "数据绑定",
            help: "dataSource",
            items: [
                new selectProp(mxConstants.STYLE_DATASOURCE, "适配器", {items: dataSource})
                // new textareaProp(mxConstants.STYLE_ONMSGARRIVED, "消息处理", 10, {
                //     type: "base64",
                //     default: doMsg.toString()
                // }),
                // new textareaProp(mxConstants.STYLE_ONCLICK, "单击事件", 10, {
                //     type: "base64",
                //     default: doClick.toString()
                // })
            ]
        }
    ];
}


// 显示定时器控件
function TimerPropView(container, graph, cell) {
    this.required = [
        mxConstants.STYLE_ID,
        mxConstants.STYLE_TIMER_FREQ
    ];
    BasePropView.call(this, container, graph, cell);
}

TimerPropView.prototype = Object.create(BasePropView.prototype);

propRender.register('timer', TimerPropView);

TimerPropView.prototype.initProp = function () {
    this.props = [
        {
            title: "高级配置",
            help: "timer",
            items: [
                new checkBoxProp(mxConstants.STYLE_VISIBLE, "是否显示", { default: "true"}),
                new inputProp(mxConstants.STYLE_TIMER_FREQ, "周期", { default: "1000"})
            ]
        }
    ];
}


// echartjs控件
function echartPropView(container, graph, cell) {
    this.required = [
        mxConstants.STYLE_ID,
        mxConstants.STYLE_TIMER_FREQ
    ];
    ShapePropView.call(this, container, graph, cell);
}

echartPropView.prototype = Object.create(ShapePropView.prototype);

propRender.register('echartBox', echartPropView);

echartPropView.prototype.initProp = function () {

    ShapePropView.prototype.initProp.apply(this, arguments);

    this.props = this.props.concat([
        {
            title: "EChart配置",
            help: "echart/script",
            items: [
                new checkBoxProp(mxConstants.STYLE_ECHART_GL, "引入GL", {default: "false"})
                // new textareaProp(mxConstants.STYLE_ECHART_SCRIPT, "脚本", 10, {
                //     type: "base64",
                //     default: getEChart()
                // })
            ]
        }
    ]);
}



