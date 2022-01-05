if (window.location.href.includes("desmos.com/calculator")) {
	if (typeof Calc != "undefined") {
		var BLock = {};
        BLock.getBezier = function(hasBON, expressions) {
            if (hasBON == 0) {
                for (var i = 0; i < expressions.length; i++) {
                    if (expressions[i].latex) if (expressions[i].latex.startsWith("b_{curve}=")) return expressions[i];
                }
            } else if (hasBON == 1) {
                for (var i = 0; i < expressions.length; i++) {
                    if (expressions[i].latex) if (expressions[i].latex.startsWith("b_{gon}=")) return expressions[i];
                }
            }
        }
        BLock.findTable = function(hasBON, expressions) {
            if (hasBON == 0) {
                for (var i = 0; i < expressions.length; i++) {
                    if (expressions[i].type == "table") if (expressions[i].columns[0].latex == 'x_{1}' && expressions[i].columns[1].latex == 'y_{1}') return expressions[i];
                }
            } else if (hasBON == 1) {
                for (var i = 0; i < expressions.length; i++) {
                    if (expressions[i].type == "table") if (expressions[i].columns[0].latex == 'x_{2}' && expressions[i].columns[1].latex == 'y_{2}') return expressions[i];
                }
            }
        }
        BLock.getFormatExpressions = function(expressions) {
            var folder = expressions.find(x => x.type === "folder" && x.title.toLowerCase().includes('format'));
            if (folder) {
                var folderID = folder.id;
                var folderExpressions = [];
                for (var i = 0; i < expressions.length; i++) {
                    if (expressions[i].folderId == folderID && expressions[i].type == "expression") folderExpressions.push(expressions[i]);
                }
                if (folderExpressions.length) {
                    var folderLatex = folderExpressions.map(x => x.latex);
                    return {
                        raw: folderExpressions,
                        latex: folderLatex
                    }
                }
            }
        }
        BLock.getHex = function(rgb) {
            rgbVal = rgb.split('\\operatorname{rgb}\\left(')[1].split('\\right)')[0].split(',');
            rgbVal = rgbVal.map(Number);
            return ("#" + ((1 << 24) + (rgbVal[0] << 16) + (rgbVal[1] << 8) + rgbVal[2]).toString(16).slice(1));
        }
        BLock.set = function() {
            var expressions = Calc.getState().expressions.list;

            var hasBON = false;
            for (var expression of expressions) {
				if (expression.latex) if (expression.latex.startsWith("b_{on}=")) hasBON = expression.latex.split('b_{on}=')[1];
			}
            if (hasBON === false) return window.alert('You deleted the b_{on} variable! Add it back.');
            hasBON = parseInt(hasBON);

            if (hasBON != 0 && hasBON != 1 && hasBON != 2) return window.alert('b_{on} has an invalid value.');

            var bezier = BLock.getBezier(hasBON, expressions);
            var table = BLock.findTable(hasBON, expressions);
            if (!bezier) { window.alert("You deleted the bezier equation!"); return; }
            if (!table) { window.alert("Please create a table of bezier points."); return; }

            var values = {
                x: table.columns[0].values, 
                y: table.columns[1].values,
                len: Math.min(table.columns[0].values.length, table.columns[1].values.length),
            };

            if (values.len < 2) { window.alert("Please input at least two points."); return; }

            var bezierLatex = bezier.latex;
            bezierLatex = bezierLatex
            .replaceAll(`\\left(\\operatorname{length}\\left(x_{${hasBON + 1}}\\right)-1\\right)!`, `${values.len-1}!`)
            .replaceAll(`\\operatorname{length}\\left(x_{${hasBON + 1}}\\right)`,`${values.len}`)
            .replaceAll(`x_{${hasBON + 1}}`,`\\left[${values.x.join(',')}\\right]`)
            .replaceAll(`\\operatorname{length}\\left(y_{${hasBON + 1}}\\right)`,`${values.len}`)
            .replaceAll(`y_{${hasBON + 1}}`,`\\left[${values.y.join(',')}\\right]`)
            .split(hasBON == 0 ? 'b_{curve}=' : 'b_{gon}=')[1];

            var expr = bezier;
            bezier.latex = bezierLatex;
            bezier.id = "block" + (new Date()).getTime();
            delete bezier.domain;
            delete bezier.parametricDomain;

            var formatExpressions = BLock.getFormatExpressions(expressions).raw;
            var formatObj = {};
            try {
                formatObj.format = parseInt(formatExpressions.find(x => x.latex.includes('f_{ormat}=')).latex.split('=')[1]);
                formatObj.color = BLock.getHex(formatExpressions.find(x => x.latex.includes('c_{olor}=')).latex.split('=')[1]);
                formatObj.lineWidth = parseInt(formatExpressions.find(x => x.latex.includes('t_{hickness}=')).latex.split('=')[1]);
                formatObj.lineOpacity = parseFloat(formatExpressions.find(x => x.latex.includes('o_{pacity}=')).latex.split('=')[1]);
                formatObj.fill = parseInt(formatExpressions.find(x => x.latex.includes('f_{ill}=')).latex.split('=')[1]);
                formatObj.fillOpacity = parseFloat(formatExpressions.find(x => x.latex.includes('f_{illopacity}=')).latex.split('=')[1]);
                formatObj.lineDash = parseInt(formatExpressions.find(x => x.latex.includes('l_{inedash}=')).latex.split('=')[1]);
            } catch (err) {
                return window.alert('One of your format options is missing!');
            }

            if (formatObj.format === 1) {
                expr.color = formatObj.color;
                expr.lineWidth = formatObj.lineWidth.toString();
                expr.lineOpacity = formatObj.lineOpacity.toString();
                if (formatObj.fill === 1) {
                    expr.fill = true;
                    expr.fillOpacity = formatObj.fillOpacity;
                    switch (formatObj.lineDash) {
                        case 0: if (expr.lineStyle) delete expr.lineStyle;
                        case 1: expr.lineStyle = "DASHED";
                        case 2: expr.lineStyle = "DOTTED";
                    }
                } else expr.fill = false;
            }

            if (expr.clickableInfo) delete expr.clickableInfo;

			Calc.setExpression(expr);
        }
		BLock.handler = function(e) {
			if (e.ctrlKey && e.altKey && ((e.code == "KeyE") || (e.key == "e"))) {
				BLock.set();
			}
		}
		document.addEventListener('keyup', BLock.handler);
	} else {
		window.alert("Hmmm, something went wrong.")
	}
} else {
	window.alert("This only works on desmos.com/calculator.")
}
