/**
 * Init Hook class.
 */
class Init {

	constructor() {

		/**
		 * Prototype add actions hook.
		 */
		(function (window, ElementPrototype, ArrayPrototype, polyfill) {
			class NodeList {
				constructor() {
					[polyfill];
				}
			}

			NodeList.prototype.length = ArrayPrototype.length;

			ElementPrototype.matchesSelector = ElementPrototype.matchesSelector ||
				ElementPrototype.mozMatchesSelector ||
				ElementPrototype.msMatchesSelector ||
				ElementPrototype.oMatchesSelector ||
				ElementPrototype.webkitMatchesSelector ||
				function matchesSelector(selector) {
					return ArrayPrototype.indexOf.call(this.parentNode.querySelectorAll(selector), this) > -1;
				};

			ElementPrototype.ancestorQuerySelectorAll = ElementPrototype.ancestorQuerySelectorAll ||
				ElementPrototype.mozAncestorQuerySelectorAll ||
				ElementPrototype.msAncestorQuerySelectorAll ||
				ElementPrototype.oAncestorQuerySelectorAll ||
				ElementPrototype.webkitAncestorQuerySelectorAll ||
				function ancestorQuerySelectorAll(selector) {
					for (var cite = this, newNodeList = new NodeList; cite = cite.parentElement;) {
						if (cite.matchesSelector(selector)) ArrayPrototype.push.call(newNodeList, cite);
					}

					return newNodeList;
				};

			ElementPrototype.ancestorQuerySelector = ElementPrototype.ancestorQuerySelector ||
				ElementPrototype.mozAncestorQuerySelector ||
				ElementPrototype.msAncestorQuerySelector ||
				ElementPrototype.oAncestorQuerySelector ||
				ElementPrototype.webkitAncestorQuerySelector ||
				function ancestorQuerySelector(selector) {
					return this.ancestorQuerySelectorAll(selector)[0] || null;
				};
		})(this, Element.prototype, Array.prototype);

		// Functions on load
		this.invoke();
	}

	/**
	 * Invokable functions.
	 */
	invoke() {

		this.log();
		this.onContentLoad();
		this.mutateDomElement('#invoiceNumber', this.generateInvoiceId(prefix));
		this.mutateDomElement('#invoiceDate', moment().format('MMMM Do, YYYY'));

		/**  Update fileanme when saving for print */
		window.onbeforeprint = () => {
			this.mutateDomElement('#headInvoiceNumber', 'Invoice For ', true);
			this.mutateDomElement('#headInvoiceNumber', this.getDomElementData('#clientName'), false);
			this.mutateDomElement('#headInvoiceNumber', ' - ', false);
			this.mutateDomElement('#headInvoiceNumber', this.getDomElementData('#clientProject'), false);
			this.mutateDomElement('#headInvoiceNumber', ' - ', false);
			this.mutateDomElement('#headInvoiceNumber', this.getDomElementData('#invoiceDate'), false);
		}

		this.updateSubTotal();
		this.handleInactiveStyles();
	}

	/**
	 * Print log to console.
	 */
	log() {
		console.info('script loaded 🟢')
	}

	/**
	 * Generate Invoice Id.
	 * 
	 * This function will generate a UID
	 * that contain a timestamp which can be extracted.
	 * 
	 * @uses simplyhexagonal/short-unique-id
	 * @package https://github.com/simplyhexagonal/short-unique-id

	 * @param {string}	prefix	UID prefix
	 * 
	 * @returns string Id
	 */
	generateInvoiceId = (prefix) => {
		let uid = new ShortUniqueId();

		return prefix + uid.stamp(10);
	}

	/**
	 * Mutate DOM element with given text content.
	 * 
	 * @param	{string}	htmlElementSelector	html element selector
	 * @param	{string}	textContent	text string to append
	 * @param	{boolean}	mutate	append or mutate
	 * 
	 * @return {void}
	 */
	mutateDomElement = (htmlElementSelector, textContent, mutate = true) => {
		let element = document.querySelector(htmlElementSelector);

		if (mutate) {
			element.innerHTML = textContent;
		} else {
			element.innerHTML += textContent;
		}
	}

	/**
	 * Get DOM element data with selector.
	 * 
	 * @param	{string}	htmlElementSelector	html element selector
	 * @return {any}
	 */
	getDomElementData = (htmlElementSelector) => {
		return document.querySelector(htmlElementSelector).innerHTML;
	}

	/**
	 * Create new table row.
	 */
	generateTableRow = () => {
		let newColumn = document.createElement('tr');

		newColumn.innerHTML = '<td>' +
			'<a class="cut">-</a>' +
			'<h3 contenteditable>1. Task Description</h3>' +
			'<p contenteditable>This is the breakdown where we can provide more information.</p>' +
			'</td>' +
			'<td contenteditable class="number inactive" id="rowHours">00</td>' +
			'<td contenteditable class="number inactive" id="rowRatePerHour">LKR 0000</td>' +
			'<td contenteditable class="number" id="rowTotal">LKR 0000</td>';

		return newColumn;
	}

	/**
	 * On content load hook.
	 */
	onContentLoad = () => {
		const onClick = (e) => {
			let element = e.target.querySelector('[contenteditable]');
			let row;

			element && e.target != document.documentElement && e.target != document.body && element.focus();

			if (e.target.matchesSelector('.add')) {
				document.querySelector('table tbody').appendChild(this.generateTableRow());
			} else if (e.target.className == 'cut') {
				row = e.target.ancestorQuerySelector('tr');

				row.parentNode.removeChild(row);
			}

			// Reinitialize scripts on row create
			this.updateSubTotal();
			this.handleInactiveStyles();
		}

		if (window.addEventListener) {
			document.addEventListener('click', onClick);
		}
	}

	/**
	 * Update sub total by calculating.
	 */
	updateSubTotal() {
		const table = document.getElementById("priceTable");

		/**
		 * TODO: 
		 * [x] get hours function
		 * [x] get rate function
		 * [] calculate total function
		 */

		/**
		 * Get row column inner HTML by index. 
		 * 
		 * @param {integer} columnIndex 
		 * @returns {string[]}
		 */
		const getRowColumn = (columnIndex) => {
			return Array.from(table.rows).slice(1).map((row) => {
				return row.cells[columnIndex].innerHTML
			})
		};

		/**
		 * Get Hours 
		 * 
		 * @returns string[]
		 */
		const getHours = () => getRowColumn(1);

		/**
		 * Get Rate
		 * 
		 * @returns string[]
		 */
		const getRate = () => getRowColumn(2);

		let rowTotal = Array.from(table.rows).slice(1).reduce((total, row) => {
			return total + parseFloat(row.cells[1].innerHTML * row.cells[2].innerHTML);
		}, 0);

		let subTotal = Array.from(table.rows).slice(1).reduce((total, row) => {
			return total + parseFloat(row.cells[3].innerHTML);
		}, 0);

		/** Update data
		this.mutateDomElement("#rowTotal", rowTotal.toFixed(2));
		this.mutateDomElement("#subtotal", subTotal.toFixed(2));
 		*/
	}

	handleInactiveStyles() {
		let elems = document.querySelectorAll('.inactive');
		elems.forEach(elem => {
			elem.addEventListener('click', () => {
				elem.classList.toggle('inactive');
			})
		})
	}

	/**
	 * Update total by calculating.
	 */
	updateTotal() {}

	/**
	 * Calculate hourly rate.
	 */
	calculateHourlyRate() {}
}

/** Initiate class instance */
new Init();