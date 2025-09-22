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