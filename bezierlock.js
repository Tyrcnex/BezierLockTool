if (window.location.href.includes("desmos.com/calculator")) {
	if (typeof Calc != "undefined") {
		var BLock = {};
        BLock.getBezier = function() {
            var expressions = Calc.getState().expressions.list;
            for (var i = 0; i < expressions.length; i++) {
				if (expressions[i].latex) if (expressions[i].latex.startsWith("b_{curve}=")) return expressions[i];
			}
        }
        BLock.findTable = function() {
            var expressions = Calc.getState().expressions.list;
            for (var i = 0; i < expressions.length; i++) {
                if (expressions[i].type == "table") if (expressions[i].columns[0].latex == 'x_{1}' && expressions[i].columns[1].latex == 'y_{1}') return expressions[i];
            }
        }
        BLock.set = function() {
            if (Calc.isAnyExpressionSelected) BLock.lastSelectedExpression = Calc.selectedExpressionId;
			var selected = BLock.lastSelectedExpression;
			if (selected === false) {
				window.alert("Please select an expression");
				return;
			}

            var bezier = BLock.getBezier();
            var table = BLock.findTable();

            if (!bezier) { window.alert("Please type a bezier equation with b_{curve}=..."); return; }
            if (!table) { window.alert("Please create a table of bezier points."); return; }

            var values = {
                x: table.columns[0].values, 
                y: table.columns[1].values,
                len: Math.min(table.columns[0].values.length, table.columns[1].values.length),
            };

            if (values.len < 2) { window.alert("Please input at least two points."); return; }

            var bezierLatex = bezier.latex;
            bezierLatex = bezierLatex
            .replaceAll('\\left(\\operatorname{length}\\left(x_{1}\\right)-1\\right)!', `${values.len-1}!`)
            .replaceAll('\\operatorname{length}\\left(x_{1}\\right)',`${values.len}`)
            .replaceAll(`x_{1}`,`\\left[${values.x.join(',')}\\right]`)
            .replaceAll('\\operatorname{length}\\left(y_{1}\\right)',`${values.len}`)
            .replaceAll(`y_{1}`,`\\left[${values.y.join(',')}\\right]`)
            .split('b_{curve}=')[1];

            var expr = bezier;
            bezier.latex = bezierLatex;
            bezier.id = "block" + (new Date()).getTime();
			Calc.setExpression(expr);
        }
		BLock.handler = function(e) {
			if (e.ctrlKey && e.altKey && ((e.code == "KeyE") || (e.key == "e"))) {
				BLock.set();
			}
		}
		document.addEventListener('keyup', BLock.handler);
	} else {
		window.alert("uh oh, something went wrong")
	}
} else {
	window.alert("this only works on desmos.com/calculator :v")
}
