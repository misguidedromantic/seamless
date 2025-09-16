const gRatio = 1.618

window.onload = async function(){
    displayManager.createDisplays()
    displayManager.loadDisplay('SME')
    displayManager.loadDisplay('Activity')
}

function onItemClick(){
    const targetElem = d3.select(this)
    const classes = targetElem.attr('class').split(' ')
    const displayTitle = classes[0]
    thisDisplay = displayManager.getDisplay(displayTitle)

    if(classes.includes('selectable')){
        thisDisplay.selectItem(targetElem.attr('id'))
    }

    if(classes.includes('title')){
        thisDisplay.toggleExpansion()
    }

}


function onItemHover(){

    const targetElem = d3.select(this)
    const id = targetElem.attr('id')
    

    targetElem.attr('font-weight','bold')
    allOtherElements = d3.selectAll('g').filter(d => d.id !== id)
    allOtherElements.attr('font-weight','normal')

}


function onItemOff(event, d){
    const elem = d3.select('#' + d.id)
    elem.attr('font-weight','normal')    

/*     const unselectedElements = d3.selectAll('g.sme.selectable').filter(d => d.selected === false)
    unselectedElements.selectAll('text').attr('font-weight', 'normal')


    const relatedElementGroup = d3.select(event.relatedTarget.parentNode)
    console.log(relatedElementGroup)

    const selectorTextElem = d3.select('#clicktoselect').selectAll('text')
    
    if(selectorTextElem.text() !== ''){
        selectorTextElem.transition()
        .duration(350)
        .tween('text', function() {
            const oldText = 'click to select'
            const newText = ''
            let textLength = oldText.length;
            return function (t) {
                this.textContent = oldText.slice(0, textLength - Math.round(t * textLength));
            }
        })
    
    }
 */
/*     const targetElem = d3.select(this)
    console.log(targetElem.attr('id'))


    const g = d3.select('#clicktoselect')
    g.selectAll('text')
        .transition()
        .duration(350)
        .tween('text', function() {
            const oldText = 'click to select'
            const newText = ''
            let textLength = oldText.length;
            return function (t) {
                this.textContent = oldText.slice(0, textLength - Math.round(t * textLength));
            }
        })
 */
}


class displayManager {

    static createDisplays(){
        const displayRow = [
            new menu ('SME', smeData.types),
            new menu ('Activity', activityData.types)
        ]

        for(let i = 0; i < displayRow.length; i++){
            const thisDisplay = displayRow[i]
            thisDisplay.setupWindow(i)
            displays[thisDisplay.title] = thisDisplay
        }
    }

    static loadDisplay(displayTitle){
        displays[displayTitle].load()
    }

    static getDisplay(displayTitle){
        return displays[displayTitle]
    }


}


class displays {
    
    static sme = {}
    static activity = {}

}

class smeData {
    static types = [
        'Side Hustle',
        'Construction Company',
        'Freelance Profressional'
    ]
}

class activityData {
    static types = [
        'Setup financial systems',
        'Establish business',
        'Sell to customer',
        'Purchase materials',
        'Pay employees',
    ]
}

class menu {
    items = []
    height = menuItem.fontSize 
    top = 0
    width = 200
    windowControl = {}
    expansionState = 'contracted'

    constructor(title, options){
        this.title = title
        this.createItems(options)
    }

    setupWindow(windowPosNum){
        this.windowControl = new windowControl()
        this.windowControl.createDiv(this.title)
        this.windowControl.createSVG(this.title)
        this.setPosition(windowPosNum)
    }

    load(){
        this.contractView()
        this.renderItems()
    }

    toggleExpansion(){
        this.expansionState === 'contracted' ? this.expandView() : this.contractView()
    }

    expandView(){
        this.height = this.getHeight('expanded')
        this.windowControl.resizeDiv(this.width, this.height)
        this.expansionState = 'expanded'
    }

    contractView(){
        this.height = this.getHeight('contracted')
        this.windowControl.resizeDiv(this.width, this.height)
        this.expansionState = 'contracted'
    }

    setPosition(windowPosNum){
        this.left = windowPosNum * this.width
        this.top = window.innerHeight - (window.innerHeight / gRatio)
        this.windowControl.reposition(this.left, this.top)
    }

    getHeight(viewType){
        const multipler = this.#getHeightMultipler(viewType)
        return Math.round(menuItem.fontSize * gRatio) * multipler  
    }

    #getHeightMultipler(viewType){
        if(viewType === 'contracted'){
            return this.getSelectedItemIndex() > 0 ? 2 : 1     
        } else {
            return this.items.length
        }
    }

    createItems(options){

        const items = []

        items.push(new menuItem ('title', this.title))
        //items.push(new menuItem ('selector', 'no selection'))

        options.forEach(option => {
            items.push(new menuItem ('selectable', option))
        });

        this.items = items
    }

    selectItem(id){
        this.items.forEach(item => {
            item.id === id ? item.selected = true : item.selected = false
        })

        this.renderItems()
        this.contractView()
    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

    renderItems(){
        const svg = this.windowControl.svg
        const positioning = new menuItemPositioning (this.items)
        const styling = new menuItemStyling (this.items)

        svg.selectAll('g.' + this.title)
            .data(this.items, d => d.id)
            .join(
                enter => {

                    const groups = enter.append('g')
                        .attr('class', d => this.title + ' ' + d.type)
                        .attr('id', d => d.id)
                        .attr('transform', (d, i) => {return positioning.getTranslate(d, i)})
                        .on('mouseover', onItemHover)
                        .on('mouseout', (event, d) => onItemOff(event, d))
                        .on('click', onItemClick)

                    groups.append('text')
                        .text(d => d.type !== 'selector' ? d.label : '')
                        .style('fill', d => styling.getTextColour(d))
                        .attr('dx', 15)
                        .attr('dy', menuItem.fontSize)
                    
                    return groups
                },

                update => {

                    update
                        .transition('itemOrder')
                        .duration(350)
                        .attr('transform', (d, i) => {return positioning.getTranslate(d, i)})

                    /* groups.selectAll('text')
                        .style('font-weight', d => styling.getFontWeight(d))
 */
                    
                },
                exit => exit
            )
    }

}


class menuItemStyling {
    constructor(items){
        this.items = items
    }

    getTextColour(d){
        switch(d.type){
            case 'title':
                return 'blue'
            case 'selector':
                return 'grey'
            default:
                return 'black'
        }
    }

    getFontWeight(d){
        return d.selected ? 'bold' : 'normal'
    }
}

class menuItemPositioning {

    constructor(items){
        this.items = items
    }

    getTranslate(d, i){
        const x = this.getPosX(d)
        const y = this.getPosY(d, i)
        return d3Helper.getTranslateString(x, y)
    }

    getPosX(d){
        
        if(d.type === 'selector'){
            return 50
        } else {return 10}
        
    }
    
    getPosY(d, i){
        const listPos = this.getListPosition(d, i)
        return listPos * Math.round(menuItem.fontSize * 1.618)
    }

    getListPosition(d, i){
        const selectedIndex = this.getSelectedItemIndex()

        if(d.id === 'SideHustle'){
            console.log(i)
            console.log(selectedIndex)
        }

        if(selectedIndex < i){
            return d.type === 'selectable' ? i : i
        }

        if(selectedIndex === i){
            return 1
        }

        if(selectedIndex > i){
            return d.type === 'selectable' ? i + 1 : i
        }




    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

}

class menuItem {

    static fontSize = 12

    constructor(type, label){
        this.type = type
        this.label = label
        this.selected = false
        this.generateID()
    }

    generateID(){
        const arr = this.label.split(' ')
        this.id = arr.join('')
    }
}



class windowControl {
    
    div = {}
    svg = {}
    divWidth = 0
    divHeight = 0
    svgWidth = 0
    svgHeight = 0

    createDiv(id, container = d3.select('body')){
        this.div = container.append('div').attr('id', id + 'Div').style('position', 'absolute')
    }
    
    createSVG(id, container = this.div){
        this.svg = container.append('svg').attr('id', id + 'Svg')
    }

    getWidth(){
        const widthText = d3.select(this.div).style('width')
        return widthText.slice(0, widthText.indexOf('px'))
    }

    resize(dimensions, duration){
        this.resizeDiv(dimensions.width, dimensions.height, duration)
        this.resizeSVG(dimensions.width, dimensions.height)
    }

    reposition(left, top){
        this.div.style('left', left + 'px').style('top', top + 'px')
    }

    resizeDiv(width, height){
        this.div.transition()
            .ease(d3.easeCubicInOut)
            .duration(500)
            .style('width', width + "px").style('height', height + "px")
    }

    resizeSVG(width, height){
        this.svg.attr('width', width).attr('height', height)
    }

}

class d3Helper {
    static getTranslateString(x, y){
        return "translate(" + x + "," + y + ")"
    }
} 