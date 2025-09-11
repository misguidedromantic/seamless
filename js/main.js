window.onload = async function(){
    
    display.setup()
    loadSME()
    

    //render SME, render SME slection options

}



function loadSME (){

    function getSMEdata(){
        return [
            new sme ('SME'),
            new sme ('select'),
            new sme ('Side Hustle'),
            new sme ('Construction Company'),
            new sme ('Freelance Profressional')
        ]
    }

    
    function render(svg, data){

        const updateSelection = function(){
        
            const clickedElement = d3.select(this)
            let i = undefined
            try{
                const id = clickedElement.attr('id')
                i = data.findIndex(obj => obj.type === id)
            } catch {
                i = 1
            } finally {
               for(let j = 0; j < data.length; j++){
                    
                    switch(j){
                        case 0:
                        case i:
                            data[j].selected = true
                            break;
                        default:
                            data[j].selected = false
                    }
                }
            }
        }

        const setPosition = function(d, i){

            const iSelected = data.findIndex(obj => obj.selected)
            
            const x = d.type === 'SME' ? 50 : 90
            const y = 50
            
            //(i - iSelected) * 17 + 30
            
            
            return d3Helper.getTranslateString(x, y)
        }

        updateSelection()

        
        svg.selectAll('g.sme')
            .data(data, d => d.type)
            .join(
                enter => {
                    const groups = enter.append('g')
                        .attr('id', d => d.type)
                        .attr('transform', (d, i) => {return setPosition(d, i)})
                        .on('click', updateSelection)
                    
/*                     groups.append('rect')
                        .attr('width', 10)
                        .attr('height', 10)
                        .attr('fill', 'white') */
                    
                    groups.append('text')
                        .text(d => d.type)
                        .style('fill', d => d.type === 'SME' ? 'blue' : 'black')
                        .attr('dx', 15)
                        .attr('dy', 9)

                    return groups
                },

                update => {
                    const groups = update.selectAll('g').attr('transform', (d, i) => {return setPosition(d, i)})
                }

            )
            
    }
    
    
    const svg = display.getCanvas()
    const data = getSMEdata()
    render(svg, data)
}



class scenario {



}

class sme {

    constructor(type){
        this.type = type
        this.selected = false
    }

    select(){
        this.selected = true
    }

    deselect(){
        this.selected = false
    }

    toggleSelection(){
        this.selected = this.selected === false ? true : false
    }


}

class display {

    static #windowControl = {}

    static setup(){
        this.#windowControl = new windowControl()
        this.#createWindow()
        this.#setDimensions()
    }

    static getCanvas(){
        return this.#windowControl.svg
    }

    static #createWindow(){
        this.#windowControl.createDiv('display')
        this.#windowControl.createSVG('display')
    }

    static #setDimensions(){
        this.#windowControl.resize({width: window.innerWidth, height: window.innerHeight})
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
        this.div = container.append('div').attr('id', id + 'Div')
    }
    
    createSVG(id, container = this.div){
        this.svg = container.append('svg').attr('id', id + 'Svg')
    }

    resize(dimensions){
        this.resizeDiv(dimensions.width, dimensions.height)
        this.resizeSVG(dimensions.width, dimensions.height)
    }


    resizeDiv(width, height){
        this.div.style('width', width + "px").style('height', height + "px")
    }

    resizeSVG(width, height){
        this.svg.attr('width', width).attr('height', height)
    }

}

class svg{

    width = 0
    height = 0
    

    constructor(id, container = d3.select('body')){
        this.id = 'svg' + id
        this.container = container
        this.createElement()
    }
    createElement(width = 10, height = 10){
        this.container.append('svg')
            .attr('id', this.id)
    }

    getElement(){
        return d3.select('#' + this.id)
    }

    resize(width, height){
        const elem = this.getElement()
        elem.attr('width', width)
            .attr('height', height)
    }


}

class div {

    width = 0
    height = 0
    top = 0
    left = 0
    
    constructor(id, container = d3.select('body')){
        this.id = 'div' + id
        this.container = container
        this.createElement(id)
    }

    createElement(){
        this.container.append('div').attr('id', this.id)
    }

    getElement(){
        return d3.select('#' + this.id)
    }

    resize(width, height, transition){
        const elem = this.getElement()
        elem.transition(transition)
            .style('width', width + 'px')
            .style('height', height + 'px')
    }

}

class d3Helper {
    static getTranslateString(x, y){
        return "translate(" + x + "," + y + ")"
    }
} 