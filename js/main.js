const gRatio = 1.618

window.onload = async function(){
    console.log('1701')
    displays.loadSME()
}

function onItemClick(){
    displays.expandSME()

    const targetElem = d3.select(this)
    if(targetElem.attr('class') === 'sme selectable'){
        displays.sme.selectMenuItem(targetElem.attr('id'))

    }


}

function onItemHover(){

    const selectorTextElem = d3.select('#clicktoselect').selectAll('text')
    
    if(selectorTextElem.text() === ''){
        selectorTextElem.transition()
        .duration(350)
        .tween('text', function() {
            const newText = 'click to select'
            let textLength = newText.length;
            return function (t) {
                this.textContent = newText.slice(0, Math.round(t * textLength));
            }
        })
    }

    const targetElem = d3.select(this)

    if(targetElem.attr('class') === 'sme selectable'){
        const textElem = targetElem.selectAll('text')
        textElem.attr('font-weight', 'bold')
    }



}


function onItemOff(event){

    const unselectedElements = d3.selectAll('g.sme.selectable').filter(d => d.selected === false)
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

function tweenWord(){

}


class displays {
    
    static sme = {}

    static loadSME (){
        const SMEs = [
            'Side Hustle',
            'Construction Company',
            'Freelance Profressional'
        ]

        this.sme = new display ('SME', SMEs)
        this.sme.load()
    }

    static expandSME(){
        this.sme.fitToContentState('expanded')
    }

    static contractSME(){
        this.sme.fitToContentState('contracted')
    }

}

class display {

    #windowControl = {}
    #contentControl = {}

    constructor(title, content){
        this.title = title
        this.content = content
        this.setup()
    }

    setup(){  
        this.#createWindow()
        this.#createContent()
    }

    load(){
        this.#contentControl.render(d3.select('#SMESvg'))
        this.fitToContentState()
    }

    selectMenuItem(itemID){
        this.#contentControl.selectItem(itemID)
        this.#contentControl.render(d3.select('#SMESvg'))
        this.fitToContentState()
    }

    fitToContentState(contentState = 'contracted'){
        const multipler = this.#getHeightMultipler(contentState)
        const width = Math.round(window.innerWidth - (window.innerWidth / gRatio))
        const height = Math.round(menuItem.fontSize * gRatio) * multipler
        this.#windowControl.resize({width: width, height: height})
    }

    #getHeightMultipler(contentState){
        if(contentState === 'contracted'){
            return this.#contentControl.getSelectedItemIndex() > 0 ? 2 : 1     
        } else {
            return this.#contentControl.items.length - 1
        }
    }

    getCanvas(){
        return this.#windowControl.svg
    }

    #createWindow(){
        this.#windowControl = new windowControl()
        this.#windowControl.createDiv(this.title)
        this.#windowControl.createSVG(this.title)
        this.#windowControl.reposition(0, window.innerHeight - (window.innerHeight / gRatio))
    }

    #createContent(){
        this.#contentControl = new menu (this.title, this.content)
    }
}


class menu {
    items = []
    maxHeight = 0
    maxWidth = 0

    constructor(title, options){
        this.title = title
        this.createItems(options)
        
    }

    createItems(options){

        const items = []

        items.push(new menuItem ('title', this.title))
        items.push(new menuItem ('selector', 'click to select'))

        options.forEach(option => {
            items.push(new menuItem ('selectable', option))
        });

        this.items = items
    }

    selectItem(id){
        this.items.forEach(item => {
            item.id === id ? item.selected = true : item.selected = false
        })
    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

    render(svg){
        const positioning = new menuItemPositioning (this.items)
        const styling = new menuItemStyling (this.items)

        svg.selectAll('g.sme')
            .data(this.items, d => d.id)
            .join(
                enter => {

                    const groups = enter.append('g')
                        .attr('class', d => 'sme ' + d.type)
                        .attr('id', d => d.id)
                        .attr('transform', (d, i) => {return positioning.getTranslate(d, i)})
                        .on('mouseover', onItemHover)
                        .on('mouseout', (event, d) => onItemOff(event))
                        .on('click', onItemClick)

                    groups.append('text')
                        .text(d => d.type !== 'selector' ? d.label : '')
                        .style('fill', d => styling.getTextColour(d))
                        .attr('dx', 15)
                        .attr('dy', menuItem.fontSize)
                    
                    return groups
                },

                update => {
                    
                    const groups = update.selectAll('g')
                        .transition('itemOrder')
                        .duration(1000)
                        .attr('transform', (d, i) => {return positioning.getTranslate(d, i)})

                    groups.selectAll('text')
                        .style('font-weight', d => styling.getFontWeight(d))

                    return groups
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
        switch(d.type){
            case 'title':
            case 'selector':
                return 0
            default:
                if(this.getSelectedItemIndex() === -1){
                    return i - 1
                }

                if(this.getSelectedItemIndex() < i){
                    return i
                }

                if(this.getSelectedItemIndex() > i){
                    return i - 1
                }
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