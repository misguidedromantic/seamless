

function testSelectionFilters(){

    function testObligationFilter(){
    
        function getTestCases(){
            const arr = []
            arr[0] = ({
                enterprise: 'side hustle',
                activity: 'starting the business',
                expectedResult: ['register for income tax']
            })

            arr[1] = ({
                enterprise: 'construction company',
                activity: 'paying employees',
                expectedResult: [
                    'calculate payroll tax',
                    'collect payroll tax',
                    'report payroll tax',
                    'pay payroll tax'
                ]
            })
            return arr
        }

        const testCases = getTestCases()
        testCases.forEach(testCase => {
            const result = obligationData.getSelectableItems(
                testCase.enterprise,
                testCase.activity)  
        
            console.log(arraysHaveSameValues(result, testCase.expectedResult))

        })
    }

    function testActivityFilter(){
    
        function getTestCases(){
            const arr = []
            arr[0] = ({
                enterprise: 'construction company',
                expectedResult: [
                    'paying employees',
                    'selling to enterprise',
                    'selling to a customer',
                    'starting the business',
                    'setting up fin. mgmt. systems',
                ]
            })

            arr[1] = ({
                enterprise: 'freelance profressional',
                expectedResult: [
                    'selling to enterprise',
                    'selling to a customer',
                    'starting the business',
                    'setting up fin. mgmt. systems',
                ]
            })

            arr[2] = ({
                enterprise: 'side hustle',
                expectedResult: [
                    'selling to a customer',
                    'starting the business',
                    'setting up fin. mgmt. systems',
                ]
            })

            return arr
        }

        const testCases = getTestCases()
        testCases.forEach(testCase => {
            const result = activityData.getSelectableItems(testCase.enterprise)  
            console.log(arraysHaveSameValues(result, testCase.expectedResult))

        })
    }

    testObligationFilter()
    testActivityFilter()

}

function arraysHaveSameValues(arr1, arr2){
    if(arr1.length !== arr2.length){
        return false
    }

    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();

    for (let i = 0; i < sortedArr1.length; i++) {
        if (sortedArr1[i] !== sortedArr2[i]) {
            return false;
        }
    }

    return true;

}

function runTestSuite(){

    const printResults = function(allResults){
        allResults.forEach(result => result.print())
    }

    const elementsCorrectlyCreated = function(checkElements){
        const results = []

        const idFound = function(domElem){
            return domElem !== null
        }

        const typeMatch = function(domElem, checkElem){
            try{return domElem.tagName === checkElem.tagName}
            catch{return false}
        }

        const calculateResult = function(checkElem, domElem){
            let result = 'fail'
            let reason = ''

            if(!idFound(domElem)){
                reason = ' (not found)'
            } else if (!typeMatch(domElem, checkElem)){
                reason = ' (found as: ' + domElem.tagName + ')'
            }

            if(idFound(domElem, checkElem) && typeMatch(domElem, checkElem)){
                result = 'pass'
            }

            return result + reason
        }

        checkElements.forEach(checkElem => {
            const domElem = document.getElementById(checkElem.id)
            const resultDescription = checkElem.id + ' created correctly'
            results.push(new testResult(resultDescription, calculateResult(checkElem, domElem)))
        })
        
        return results
    }

    const checkElements = [
        new checkElement('smeSelectorDiv','div'),
        new checkElement('smeSelectorSvg','svg'),
        new checkElement('smeActivityDiv','div'),
        new checkElement('smeActivitySvg','svg')
    ]
    
    const testResults = elementsCorrectlyCreated(checkElements)
    printResults(testResults)
}

class testResult {
    constructor(description, result){
        this.description = description
        this.result = result
    }

    print(){
        const message = this.description + ': ' + this.result
        console.log(message)
    }
}

class checkElement {
    constructor (id, tagName){
       this.id = id
       this.tagName = tagName.toUpperCase()
    }
}