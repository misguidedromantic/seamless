const gRatio = 1.618

window.onload = async function(){
    displayManager.createDisplays()
    displayManager.loadDisplay('SME')
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
}

function onItemClick(){
    const targetElem = d3.select(this)
    const classes = targetElem.attr('class').split(' ')
    const displayTitle = classes[0]
    thisDisplay = displayManager.getDisplay(displayTitle)
    
    if(thisDisplay.constructor.name === 'menu'){
        thisDisplay.itemClicked(targetElem)
    }

}








class displayManager {

    static createDisplays(){
        const displayRow = [
            new menu ('SME', smeData),
            new menu ('Activity', activityData)
        ]

        for(let i = 0; i < displayRow.length; i++){
            const thisDisplay = displayRow[i]
            thisDisplay.setup(i)
            displays[thisDisplay.title] = thisDisplay
        }
    }

    static selectionTrigger (sourceDisplayTitle, sourceSelection){
        switch(sourceDisplayTitle){
            case 'SME':
                displays.activity.load()
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
    static get(){
        return this.#types
    }

    static #types = [
        'Side hustle',
        'Construction company',
        'Freelance profressional'
    ]
}

class activityData {
    static get (smeType){
        const activities = []
        switch(smeType){
            default:
            case 'Construction company':
                activities.push('paying employees')
            case 'Freelance profressional':
                activities.push('buying equipment')
            case 'Side hustle':
                activities.push('selling to a customer')
                activities.push('starting the business')
                activities.push('setting up fin. mgmt. systems')
        }
        return activities
    }
}

class obligationData {

    static get (){

    }

}

class menu {
    items = []
    height = menuItem.fontSize 
    top = 0
    width = 200
    dynamics = {}
    dataSource = {}
    expansionState = 'contracted'

    constructor(title, dataSource){
        this.title = title
        this.dataSource = dataSource
        
    }

    setup(windowPosNum){
        this.createItems()
        this.setupWindow(windowPosNum) 
    }

    createItems(){
        const sourceItems = this.dataSource.get()
        this.items.push(new menuItem ('title', this.title))
        //items.push(new menuItem ('selector', 'no selection'))
        sourceItems.forEach(option => {
            this.items.push(new menuItem ('selectable', option))
        });
    }

    setupWindow(windowPosNum){
        const thisWindowControl = new windowControl()
        thisWindowControl.createDiv(this.title)
        thisWindowControl.createSVG(this.title)
        this.dynamics = new menuDynamics(this.title, thisWindowControl)
        this.dynamics.move(windowPosNum)
    }

    load(){
        this.dynamics.contract(this.items)
        this.dynamics.renderItems(this.items)
    }

    itemClicked(clickedElem){
        const clickedItem = clickedElem.data()[0]

        switch(clickedItem.type){
            case 'selectable':
                this.updateSelection(clickedItem)
                this.dynamics.renderItems(this.items)
                break;
            case 'title':
                this.dynamics.expand(this.items)
            default:
        }
    }

    updateSelection(clickedItem){
         if(clickedItem.selected){
            clickedItem.selected = false
         } else {
            clickedItem.selected = true 
            this.deselectOtherItems(clickedItem.id)
            this.dynamics.contract(this.items)
         }
    }

    deselectOtherItems(selectedID){
        const remainingItems = this.items.filter(item => {item.type === 'selectable', item.id !== selectedID})
        remainingItems.map(obj => ({...obj, selected: false}))
    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

}

class menuDynamics {

    constructor(menuTitle, windowControl){
        this.menuTitle = menuTitle
        this.windowControl = windowControl
    }

    expand(items){
        const currentWidth = this.windowControl.getWidth()
        const multipler = this.#calculateHeightMultipler('expanded', items)
        const expandedHeight = this.#calculateHeight(multipler)
        const dimensions = {width: currentWidth, height: expandedHeight}
        this.windowControl.resize(dimensions, 400)
    }
    
    contract(items){
        const currentWidth = this.windowControl.getWidth()
        const multipler = this.#calculateHeightMultipler('contracted', items)
        const contractedHeight = this.#calculateHeight(multipler)
        const dimensions = {width: currentWidth, height: contractedHeight}
        this.windowControl.resize(dimensions, 400)
    }

    move(windowPosNum){
        const currentWidth = this.windowControl.getWidth()
        const left = windowPosNum * currentWidth
        const top = window.innerHeight - (window.innerHeight / gRatio)
        this.windowControl.reposition(left, top)
    }

    #calculateHeight(multipler){
        return Math.round(menuItem.fontSize * gRatio) * multipler  
    }

    #calculateHeightMultipler(viewType, items){
        if(viewType === 'contracted'){
            return this.#getSelectedItemIndex(items) > 0 ? 2 : 1     
        } else {
            return items.length
        }
    }

    #getSelectedItemIndex(items){
        return items.findIndex(item => item.selected === true)    
    }

    renderItems(items){
        const svg = this.windowControl.svg
        const positioning = new menuItemPositioning (items)
        const styling = new menuItemStyling (items)

        svg.selectAll('g.' + this.menuTitle)
            .data(items, d => d.id)
            .join(
                enter => {

                    const groups = enter.append('g')
                        .attr('class', d => this.menuTitle + ' ' + d.type)
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
        const widthText = this.div.style('width')
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

