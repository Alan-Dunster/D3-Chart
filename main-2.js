d3.csv('data2016.csv').then(data => draw(data))

const ENABLED_OPACITY = 1;
const DISABLED_OPACITY = .2;

const timeFormatter = d3.timeFormat('%Y-%b-%d');

function draw(data) {
  const margin = { top: 20, right: 20, bottom: 50, left: 50 };//
  const previewMargin = { top: 20, right: 20, bottom: 15, left: 50 };//
  const width = 1000 - margin.left - margin.right;//
  const height = 400 - margin.top - margin.bottom;//

  const ratio = 2.5;//

  const previewWidth = width / ratio;
  const previewHeight = height / ratio;

  const x = d3.scaleTime()
    .range([0, width]);

  const y = d3.scaleLinear()
    .range([height, 0]);

  let rescaledX = x;
  let rescaledY = y;

  const previewX = d3.scaleTime()
    .range([0, previewWidth]);

  const previewY = d3.scaleLinear()
    .range([previewHeight, 0]);


  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)


  const chartAreaWidth = width + margin.left + margin.right;
  const chartAreaHeight = height + margin.top + margin.bottom;

  const zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [chartAreaWidth, chartAreaHeight]])
    .on('start', () => {
      hoverDot
        .attr('cx', -5)
        .attr('cy', 0);
    })
    .on('zoom', zoomed);

  const svg = d3.select('.chart1')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${ margin.left },${ margin.top })`);

  data.forEach(function (d) {
    d.date = new Date(d.date);
    d.level = +d.level;
  });

  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([0, d3.max(data, function(d) { return d.level; })]);


  previewX.domain(d3.extent(data, d => d.date));
  previewY.domain([0, d3.max(data, d => d.level)]);
  colorScale.domain(d3.map(data, d => d.typeId).keys());

  const xAxis = d3.axisBottom(x)
    .ticks((width + 2) / (height + 2) * 5)
    .tickSize(-height - 6)
    .tickPadding(10);

  const xAxisPreview = d3.axisBottom(previewX)
    .tickSize(4)
    .tickValues(previewX.domain())
    .tickFormat(d3.timeFormat('%d/%m/%Y'));

  const yAxisPreview = d3.axisLeft(previewY)
    .tickValues(previewY.domain())
    .tickSize(4)
    .tickFormat(d => Math.round(d));

  const yAxis = d3.axisRight(y)
    .ticks(5)
    .tickSize(7 + width)
    .tickPadding(-11 - width)
    .tickFormat(d => d);

  const xAxisElement = svg.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0,${ height + 6 })`)
    .call(xAxis);

  const yAxisElement = svg.append('g')
    .attr('transform', 'translate(-7, 0)')
    .attr('class', 'axis y-axis')
    .call(yAxis);

  svg.append('g')
    .attr('transform', `translate(0,${ height })`)
    .call(d3.axisBottom(x).ticks(0));

  svg.append('g')
    .call(d3.axisLeft(y).ticks(0));

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Pollution levels (µg/m³). Temp (°C).");

  svg.append('defs').append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height);

 const nestBytypeId = d3.nest()
   .key(d => d.typeId)
    .sortKeys((v1, v2) => (parseInt(v1, 10) > parseInt(v2, 10) ? 1 : -1))
    .entries(data);


  const typesNamesById = {};

  nestBytypeId.forEach(item => {
    typesNamesById[item.key] = item.values[0].typeName;
  });

  const types = {};

  d3.map(data, d => d.typeId)
    .keys()
    .forEach(function (d, i) {
      types[d] = {
        data: nestBytypeId[i].values,
        enabled: true
      };
    });

  const typesIds = Object.keys(types);

  const lineGenerator = d3.line()
   // .curve(d3.curveBasis)
    .x(d => rescaledX(d.date))
    .y(d => rescaledY(d.level));

    const nestByDate = d3.nest()
    .key(d => d.date)
    .entries(data);


  const percentsByDate = {};

  nestByDate.forEach(dateItem => {
    percentsByDate[dateItem.key] = {};

    dateItem.values.forEach(item => {
      percentsByDate[dateItem.key][item.typeId] = item.level;
    });
  });

  const legendContainer = d3.select('.legend1');

  const legendsSvg = legendContainer
    .append('svg');

  const legendsDate = legendsSvg.append('text') 
    .attr('visibility', 'hidden')
    .attr('x', 40)
    .attr('y', 20)//
    .style('font-weight', 'bold')
    .style('font-size', 20); //

  const legends = legendsSvg.attr('width', 200)//
    .attr('height', 200)//
    .attr('align-content', 'center')
    .selectAll('g')
    .data(typesIds)
    .enter()
    .append('g')
    .attr('class', 'legend-item1')
    .attr('transform', (typeId, index) => `translate(0,${ index * 20 + 20 })`)
    .on('click', clickLegendRectHandler);

  const legendsValues = legends
    .append('text')
    .attr('x', 0)
    .attr('y', 20)//
    .attr('class', 'legend-value');

  legends.append('rect')
    .attr('x', 60)//
    .attr('y', 10)
    .attr('width', 12)
    .attr('height', 12)
    .style('fill', typeId => colorScale(typeId))
    .select(function() { return this.parentNode; })
    .append('text')
    .attr('x', 80)//
    .attr('y', 20)
    .text(typeId => typesNamesById[typeId])
    .attr('class', 'legend-text')
    .style('text-anchor', 'start');

  const extraOptionsContainer = legendContainer.append('div')
    .attr('class', 'extra-options-container1');

  extraOptionsContainer.append('div')
    .attr('class', 'hide-all-option1')
    .text('Hide all')//
    .on('click', () => {
      typesIds.forEach(typeId => {
        types[typeId].enabled = false;
      });

      singleLineSelected = false;

      redrawChart();
    });

  extraOptionsContainer.append('div')
    .attr('class', 'show-all-option1')
    .text('Show all')//
    .on('click', () => {
      typesIds.forEach(typeId => {
        types[typeId].enabled = true;
      });

      singleLineSelected = false;

      redrawChart();
    });

  const linesContainer = svg.append('g')
    .attr('clip-path', 'url(#clip)');

  let singleLineSelected = false;

  const voronoi = d3.voronoi()
    .x(d => x(d.date))
    .y(d => y(d.level))
    .extent([[0, 0], [width, height]]);

  const hoverDot = svg.append('circle')
    .attr('class', 'dot')
    .attr('r', 5)//
    .attr('clip-path', 'url(#clip)')
    .style('visibility', 'hidden');

  let voronoiGroup = svg.append('g')
    .attr('class', 'voronoi-parent')
    .attr('clip-path', 'url(#clip)')
    .append('g')
    .attr('class', 'voronoi')
    .on('mouseover', () => {
      legendsDate.style('visibility', 'visible');
      hoverDot.style('visibility', 'visible');
    })
    .on('mouseout', () => {
      legendsValues.text('');
      legendsDate.style('visibility', 'hidden');
      hoverDot.style('visibility', 'hidden');
    });

  const zoomNode = d3.select('.voronoi-parent').call(zoom);

  d3.select('.reset-zoom-button1').on('click', () => {
    rescaledX = x;
    rescaledY = y;

    d3.select('.voronoi-parent').transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);
  });


  const preview = d3.select('.preview1')
    .append('svg')
    .attr('width', previewWidth + previewMargin.left + previewMargin.right)
    .attr('height', previewHeight + previewMargin.top + previewMargin.bottom)
    .append('g')
    .attr('transform', `translate(${ previewMargin.left },${ previewMargin.top })`);

  const previewContainer = preview.append('g');

  preview.append('g')
    .attr('class', 'preview-axis x-axis')
    .attr('transform', `translate(0,${ previewHeight })`)
    .call(xAxisPreview);

  preview.append('g')
    .attr('class', 'preview-axis y-axis')
    .attr('transform', 'translate(0, 0)')
    .call(yAxisPreview);

  previewContainer.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', previewWidth)
    .attr('height', previewHeight)
    .attr('fill', '#bbbbbb')//
    .style('stroke', '#cacaca');//

  const previewLineGenerator = d3.line()
    .x(d => previewX(d.date))
    .y(d => previewY(d.level));

  const draggedNode = previewContainer
    .append('rect')
    .data([{ x: 0, y: 0 }])
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', previewWidth)
    .attr('height', previewHeight)
    .attr('fill', '#ffffff')//
    .style('stroke', '#cacaca')//
    .style('cursor', 'move')//
    .call(d3.drag().on('drag', dragged));

  redrawChart();

  function redrawChart(showingtypesIds) {
    const enabledtypesIds = showingtypesIds || typesIds.filter(typeId => types[typeId].enabled);

    const paths = linesContainer
      .selectAll('.line')
      .data(enabledtypesIds);

    paths.exit().remove();

    if (enabledtypesIds.length === 1) {
      const previewPath = previewContainer
        .selectAll('path')
        .data(enabledtypesIds);

      previewPath.exit().remove();

      previewPath
        .enter()
        .append('path')
        .merge(previewPath)
        .attr('class', 'line')
        .attr('d', typeId => previewLineGenerator(types[typeId].data))
        .style('stroke', typeId => colorScale(typeId));
    }

    paths
      .enter()
      .append('path')
      .merge(paths)
      .attr('class', 'line')
      .attr('id', typeId => `type-${ typeId }`)
      .attr('d', typeId => lineGenerator(types[typeId].data))
      .style('stroke', typeId => colorScale(typeId));

    legends.each(function(typeId) {
      const opacityValue = enabledtypesIds.indexOf(typeId) >= 0 ? ENABLED_OPACITY : DISABLED_OPACITY;

      d3.select(this).attr('opacity', opacityValue);
    });

    const filteredData = data.filter(dataItem => enabledtypesIds.indexOf(dataItem.typeId) >= 0);

    const voronoiPaths = voronoiGroup.selectAll('path')
      .data(voronoi.polygons(filteredData));

    voronoiPaths.exit().remove();

    voronoiPaths
      .enter()
      .append('path')
      .merge(voronoiPaths)
      .attr('d', d => (d ? `M${ d.join('L') }Z` : null))
      .on('mouseover', voronoiMouseover)
      .on('mouseout', voronoiMouseout)
      .on('click', voronoiClick);
  }

  function clickLegendRectHandler(typeId) {
    if (singleLineSelected) {
      const newEnabledtypes = singleLineSelected === typeId ? [] : [singleLineSelected, typeId];

      typesIds.forEach(currenttypeId => {
        types[currenttypeId].enabled = newEnabledtypes.indexOf(currenttypeId) >= 0;
      });
    } else {
      types[typeId].enabled = !types[typeId].enabled;
    }

    singleLineSelected = false;

    redrawChart();
  }

  function voronoiMouseover(d) {
    const transform = d3.zoomTransform(d3.select('.voronoi-parent').node());

    legendsDate.text(timeFormatter(d.data.date));

    legendsValues.text(dataItem => {
      const value = percentsByDate[d.data.date][dataItem];

      return value ? value + '' : 'N.A.';
    });

    d3.select(`#type-${ d.data.typeId }`).classed('type-hover', true);

    const previewPath = previewContainer
      .selectAll('path')
      .data([d.data.typeId]);

    previewPath.exit().remove();

    previewPath
      .enter()
      .append('path')
      .merge(previewPath)
      .attr('class', 'line')
      .attr('d', typeId => previewLineGenerator(types[typeId].data)
      )
      .style('stroke', typeId => colorScale(typeId));

    hoverDot
      .attr('cx', () => transform.applyX(x(d.data.date)))
      .attr('cy', () => transform.applyY(y(d.data.level)));
  }

  function voronoiMouseout(d) {
    if (d) {
      d3.select(`#type-${ d.data.typeId }`).classed('type-hover', false);
    }
  }

  function voronoiClick(d) {
    if (singleLineSelected) {
      singleLineSelected = false;

      redrawChart();
    } else {
      const typeId = d.data.typeId;

      singleLineSelected = typeId;

      redrawChart([typeId]);
    }
  }

  function clamp(number, bottom, top) {
    let result = number;

    if (number < bottom) {
      result = bottom;
    }

    if (number > top) {
      result = top;
    }

    return result;
  }

  function dragged(d) {
    const draggedNodeWidth = draggedNode.attr('width');
    const draggedNodeHeight = draggedNode.attr('height');
    const x = clamp(d3.event.x, 0, previewWidth - draggedNodeWidth);
    const y = clamp(d3.event.y, 0, previewHeight - draggedNodeHeight);

    d3.select(this)
      .attr('x', d.x = x)
      .attr('y', d.y = y);

    zoomNode.call(zoom.transform, d3.zoomIdentity
      .scale(currentTransformationValue)
      .translate(-x * ratio, -y * ratio)
    );
  }

  let currentTransformationValue = 1;

  function zoomed() {
    const transformation = d3.event.transform;

    const rightEdge = Math.abs(transformation.x) / transformation.k + width / transformation.k;
    const bottomEdge = Math.abs(transformation.y) / transformation.k + height / transformation.k;

    if (rightEdge > width) {
      transformation.x = -(width * transformation.k - width);
    }

    if (bottomEdge > height) {
      transformation.y = -(height * transformation.k - height);
    }

    rescaledX = transformation.rescaleX(x);
    rescaledY = transformation.rescaleY(y);

    xAxisElement.call(xAxis.scale(rescaledX));
    yAxisElement.call(yAxis.scale(rescaledY));

    linesContainer.selectAll('path')
      .attr('d', typeId => {
        return d3.line()
        //.curve(d3.curveBasis)
          .defined(d => d.level !== 0)
          .x(d => rescaledX(d.date))
          .y(d => rescaledY(d.level))(types[typeId].data);
      });

    voronoiGroup
      .attr('transform', transformation);

    const xPreviewPosition = previewX.range().map(transformation.invertX, transformation)[0];
    const yPreviewPosition = previewY.range().map(transformation.invertY, transformation)[1];

    currentTransformationValue = transformation.k;

    draggedNode
      .data([{ x: xPreviewPosition / ratio, y: yPreviewPosition / ratio }])
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', previewWidth / transformation.k)
      .attr('height', previewHeight / transformation.k);
  }
}


