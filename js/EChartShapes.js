// echartjs容器控件
function echartBox(bounds, fill, stroke, strokewidth) {
    mxRectangleShape.call(this, bounds, fill, stroke, strokewidth);
}
mxUtils.extend(echartBox, mxRectangleShape);

echartBox.prototype.init = function (container) {
    mxRectangleShape.prototype.init.apply(this, arguments);
    var adapter = this.state.cell.adapter;
    if(adapter){
        var id = 'chart_' + mxUtils.getValue(this.style, mxConstants.STYLE_ID, new Date().getTime());
        this.state.cell.setValue('<div id="' + id + '"></div>');
        var box = document.createElement('div');
        box.style.width = this.state.width + 'px';
        box.style.height = this.state.height + 'px';
        adapter.box = box;
        var self = this;
        var scripts = ["lib/echarts/echarts.min.js"];
        if(mxUtils.getValue(self.style, mxConstants.STYLE_ECHART_GL, false)){
            scripts.push("lib/echarts/echarts-gl.min.js");
        }
        getScript(scripts,function () {
            var chart = echarts.init(box);
            adapter.chart = chart;
            var timer = setInterval(function () {
                var main = document.getElementById(id);
                if (main) {
                    clearInterval(timer);
                    main.appendChild(box);
                }
            }, 1);
            self.run_script();
        });
    }
}

echartBox.prototype.run_script = function () {
    this.chart = this.state.cell.adapter.chart;
    var code = mxUtils.getValue(this.style, mxConstants.STYLE_ECHART_SCRIPT, null);
    if (code) {
        code = Base64.decode(code);
        eval(code);
    }
}

// line simple
echartBox.prototype.line_simple = function() {
    option = {
        xAxis: {
            type: 'category',
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            data: [150, 230, 224, 218, 135, 147, 260],
            type: 'line'
        }]
    };
    this.chart.setOption(option);
}

mxCellRenderer.registerShape('echartBox', echartBox);
