window.onload = async function(){



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
        this.resizeDiv(dimensions.width, dimensions.divHeight)
        this.resizeSVG(dimensions.width, dimensions.svgHeight)
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
            //.attr('width', width)
            //.attr('height', height)
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