import { initializeApp } from 'firebase/app'
import {
	getFirestore, collection, onSnapshot,
	addDoc, orderBy, serverTimestamp, query
} from 'firebase/firestore'

const firebaseConfig = {
	apiKey: "AIzaSyAWIhDT69rm9Hp6ODXFRW5qIDvu6OEC_BA",
	authDomain: "calculator-6b06b.firebaseapp.com",
	projectId: "calculator-6b06b",
	storageBucket: "calculator-6b06b.appspot.com",
	messagingSenderId: "468576084390",
	appId: "1:468576084390:web:df8285a13a3c0b6224af67",
	measurementId: "G-2RSBYLNQMB"
};

// init firebase
initializeApp(firebaseConfig)

// init services
const db = getFirestore()


let currentHistoryIndex = 0; // Global index tracker
let history = []; //global data 
let onhistory;

// collection ref
const colRef = collection(db, 'history')

const q = query(colRef, orderBy('createdAt'))


onSnapshot(q, (snapshot) => {
	// Reset the global history array
	history.length = 0;

	snapshot.docs.forEach(doc => {
		history.push({ ...doc.data(), id: doc.id });
	});

});
document.addEventListener('DOMContentLoaded', () => {
	const formulaDisplay = document.getElementById('formula');
	const resultDisplay = document.getElementById('result');
	let currentInput = '';
	let operation = null;
	let fullFormula = '';

	const updateFormulaDisplay = () => {
		formulaDisplay.textContent = fullFormula + currentInput;
	};

	const calculateResult = () => {
		try {
			let adjustedFormula = fullFormula + currentInput;
			// Replace '^' with '**' for exponentiation
			adjustedFormula = adjustedFormula.replace(/\^/g, '**');
			let result = eval(adjustedFormula); // eval
			resultDisplay.textContent = result.toString();
		} catch (e) {
			resultDisplay.textContent = 'Error';
		}
	};

	const handleNumberInput = (number) => {
		onhistory = false;
		currentHistoryIndex = 0;
		currentInput += number;
		updateFormulaDisplay();
		calculateResult();
	};

	const handleDelete = () => {
		onhistory = false;
		if (currentInput.length > 0) {
			currentInput = currentInput.slice(0, -1);

		} else if (fullFormula.length > 0) {

			if (fullFormula.endsWith(' ')) {
				fullFormula = fullFormula.slice(0, -3);

			} else {
				fullFormula = fullFormula.slice(0, -1);
			}
		}
		updateFormulaDisplay();
		calculateResult();
	};

	const handleOperationInput = (op) => {
		onhistory = false;
		if (currentInput === '' && op === '-' && operation === null) {
			currentInput = '-';
			updateFormulaDisplay();
			return;
		}

		if (currentInput !== '' || (fullFormula !== '' && op !== '-')) {
			fullFormula += currentInput + ' ' + op + ' ';
			currentInput = '';
			operation = null;
			calculateResult();
		} else if (operation === null) {
			fullFormula = fullFormula.slice(0, -3) + op + ' ';
		}

		if (op === '^') {
			if (currentInput !== '') {
				fullFormula += currentInput + ' ^ ';
				currentInput = '';
				operation = null;
			} else if (fullFormula !== '' && !fullFormula.endsWith('^ ')) {
				fullFormula += ' ^ ';
			}
		}


		operation = op;
		updateFormulaDisplay();
	};

	const toRadians = (angle) => {
		return angle * (Math.PI / 180);
	};



	const countParentheses = () => {
		let openCount = 0;
		let closeCount = 0;
		const combinedString = fullFormula + currentInput;
	
		for (let i = 0; i < combinedString.length; i++) {
			if (combinedString[i] === '(') {
				openCount++;
			} else if (combinedString[i] === ')') {
				closeCount++;
			}
		}
	
		return { open: openCount, close: closeCount };
	};


	const handleParentheses = () => {
		onhistory = false;
		const { open, close } = countParentheses();
		const lastCharIsNumber = isLastCharacterNumber();

		if (open === close || "*/+-^".includes(fullFormula.slice(-1))) {
			currentInput += lastCharIsNumber ? '*(' : '(';
		} else if (open > close) {
			currentInput += ')';
		}
		updateFormulaDisplay();
		calculateResult();
	};


	const handleEqualPress = () => {
		onhistory = false;
		calculateResult();

		let result = resultDisplay.textContent;

		if (result !== 'Error') {
			addDoc(colRef, {
				formula: fullFormula + currentInput,
				result: result,
				createdAt: serverTimestamp()
			})
		}

		if (result === 'Error') {
			fullFormula = '';
		} else {
			fullFormula = result;
		}

		currentInput = '';
		operation = null;
		updateFormulaDisplay();
	};

	const handleClearAll = () => {
		onhistory = false;
		currentInput = '';
		operation = null;
		fullFormula = '';
		updateFormulaDisplay();
		resultDisplay.textContent = '0';
	};

	const endsWithNumber = (str) => {
		if (str.length === 0) {
			return false;
		}
		const lastChar = str[str.length - 1];
		return lastChar >= '0' && lastChar <= '9';
	};

	
	const isLastCharacterNumber = () => {
		const formula = fullFormula + currentInput;
		return formula.length > 0 && !isNaN(formula[formula.length - 1]);
	};


	const handleConstantInput = (constant) => {
		onhistory = false; 

		// Check if the last character of fullFormula or currentInput is a number
		if ( endsWithNumber(currentInput)) {
			currentInput += '*'; 
		}
	
		switch (constant) {
			case 'e':
				currentInput += Math.E.toString();
				break;
			case 'π':
				currentInput += Math.PI.toString();
				break;
		}
	
		updateFormulaDisplay();
		calculateResult();
	};
	

	const handleSpecialFunction = (func) => {
		onhistory = false;
		let valueToCalculate = parseFloat(currentInput);

		if (isNaN(valueToCalculate)) {
			return;
		}

		let result;
		switch (func) {
			case 'sin':
				result = Math.sin(toRadians(valueToCalculate));
				break;
			case 'cos':
				result = Math.cos(toRadians(valueToCalculate));
				break;
			case 'tan':
				result = Math.tan(toRadians(valueToCalculate));
				break;

		}

		fullFormula = result.toString();
		updateFormulaDisplay();
		calculateResult();
	};

	const historyButton = document.getElementById('history-button');
	historyButton.addEventListener('click', () => {
		onhistory = true;
		if (history.length > 0) {
			currentHistoryIndex = 0;
			const latestItem = history[currentHistoryIndex];

			fullFormula = latestItem.formula;
			currentInput = '';
			updateFormulaDisplay();

			resultDisplay.textContent = latestItem.result;
		} else {
			console.log('No history data available');
		}
	});


	const historybackButton = document.getElementById('history-back');
	historybackButton.addEventListener('click', () => {

		if (!onhistory) { return; }

		if (history.length > 0 && currentHistoryIndex < history.length - 1) {
			currentHistoryIndex++; 
			const nextItem = history[currentHistoryIndex];

			fullFormula = nextItem.formula;
			updateFormulaDisplay();
			resultDisplay.textContent = nextItem.result;
		} else {
			console.log('No more history data available');
		}
	});



	document.querySelectorAll('.btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const value = btn.textContent;
			if (parseFloat(value) >= 0 || value === '.') {
				handleNumberInput(value);
			} else {
				switch (value) {
					case 'AC':
						handleClearAll();
						break;
					case '=':
						handleEqualPress();
						break;
					case '()':
						handleParentheses();
						break;
					case 'e':
						handleConstantInput(value);
						break;
					case 'π':
						handleConstantInput(value);
						break;
					case 'DEL':
						handleDelete();
						break;
					case 'sin':
						handleSpecialFunction(value);
						break;
					case 'cos':
						handleSpecialFunction(value);
						break;
					case 'tan':
						handleSpecialFunction(value);
						break;
					default:
						handleOperationInput(value);
						break;
				}
			}
		});
	});
});

