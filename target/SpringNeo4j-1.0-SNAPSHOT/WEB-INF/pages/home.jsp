<%--
  Created by IntelliJ IDEA.
  User: Bean
  Date: 19-Jul-17
  Time: 2:21 PM
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Title</title>
    <style>

        .link {
            fill: none;
            stroke: #ccc;
            stroke-width: 1.5px;
        }

        circle {
            stroke: #ccc;
            stroke-width: 1.5px;
        }

        text {
            font: 10px sans-serif;
            pointer-events: none;
            /*text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;*/
        }


    </style>
</head>
<body>
<div class="header" align="center">
    <h2>Topic Evolution</h2>
</div>
<script src="//d3js.org/d3.v3.min.js"></script>
<script src="http://code.jquery.com/jquery-3.2.1.min.js"></script>
<script>

    $.ajaxSetup({
        headers: {
            "Authorization": 'Basic ' + window.btoa("neo4j"+":"+"1234567")
        }
    });

    $.ajax({
        type: "POST",
        url: "http://localhost:7474/db/data/transaction/commit",
        data: JSON.stringify({
            statements: [{
                //statement: "MATCH (n) MATCH p=()-[]-(n) WHERE EXISTS(n.title) RETURN n.title, p limit 10",
                statement: "MATCH p=()-[r:has]-() return p",
//                parameters: params || {},
                resultDataContents: ["row", "graph"]
            }]
        }),
        dataType: "json",
        contentType: "application/json;charset=UTF-8",
        error: function(err) {
            console.log(err)
        },
        success: function(res) {
            console.log(res)
            var nodeArr = [], linkArr = [];

            var data = convertToJson(res, nodeArr, linkArr);
            draw(data);
        }
    });

    // functions to convert Neo4j res to d3 format
    function idIndex(a, id) {
        for (var i = 0; i < a.length; i++) {
            if (a[i].id == id) return i;
        }
        return null;
    }

    function convertToJson(res, nodeArr, linkArr) {
        console.log("res");
        console.log(JSON.stringify(res));
        var nodes = nodeArr, links = linkArr;
        res.results[0].data.forEach(function (row) {
            row.graph.nodes.forEach(function (n) {
                if (idIndex(nodes, n.id) == null) {
                    if (n.properties.name) {
                       if(n.properties.name == "Topic Evolution") nodes.push({id: n.id, label: n.labels[0], title: n.properties.name, color: "#FFCC00"})
                       else nodes.push({id: n.id, label: n.labels[0], title: n.properties.name, color: "#FF66FF"});     //topic
                    }
                    else if(n.properties.title) nodes.push({id: n.id, label: n.labels[0], title: n.properties.title, color: "#CC66FF"});     //paper
                    else nodes.push({id: n.id, label: n.labels[0], title: n.properties.value, color: "#6600FF"});     //timestamp
                }
            });
            links = links.concat(row.graph.relationships.map(function (r) {
                return {source: idIndex(nodes, r.startNode), target: idIndex(nodes, r.endNode), type: r.type};
            }));
        });
        var data = {nodes: nodes, links: links};
        return data;
    }

    function draw(data){
        console.log("drawing");
        <%-- draw D3 --%>
        var nodes = data.nodes;
        console.log(JSON.stringify(nodes));
        var links = data.links;
        console.log(JSON.stringify(links));

        var width = 1200,
            height = 850;

        // Compute the distinct nodes from the links.
        links.forEach(function(link) {
            link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
            link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
        });

        var force = d3.layout.force()
            .nodes(nodes)
            .links(links)
            .size([width, height])
            .linkDistance(60)
            .charge(-300)
            .on("tick", tick)
            .start();

        var svg = d3.select("#vis").append("svg")
            .attr("width", width)
            .attr("height", height);

        svg.selectAll("circle.node").on("click", function(){
            svg.select(this).attr('r', 25)
                .style("fill","lightcoral")
                .style("stroke","red");
        });

        var path = svg.append("g").selectAll("path")
            .data(force.links())
            .enter().append("path")
            .style("stroke", function (d) {
                if(d.type == "has") return "#6600FF";
                if(d.type == "written_in") return "#CC66FF";
                if(d.type == "appears") return "#FF66FF";
            })
            .attr("class", function(d) { return "link " + d.type; });

        var circle = svg.append("g").selectAll("circle")
            .data(force.nodes())
            .enter().append("circle")
            .attr("r", function(d) {
                if(d.label == "Root") return 12;
                if(d.label == "Timestamp") return 10;
                if(d.label == "Topic") return 8;
                if(d.label == "Paper") return 6;
            })
            .style("fill", function (d) {
                return d.color;
            })
            .on("click", function(d){
                $.ajax({
                    type: "POST",
                    url: "http://localhost:7474/db/data/transaction/commit",
                    data: JSON.stringify({
                        statements: [{
                            statement: "MATCH p=()-[r:appears]-(n) WHERE n.value = \"" + d.title + "\" return p",
                            resultDataContents: ["row", "graph"]
                        }]
                    }),
                    dataType: "json",
                    contentType: "application/json;charset=UTF-8",
                    error: function (err) {
                        console.log(err)
                    },
                    success: function (res) {
                        //update(data);
                    }
                });
            })
            .call(force.drag);

        var text = svg.append("g").selectAll("text")
            .data(force.nodes())
            .enter().append("text")
            .attr("x", 8)
            .attr("y", ".31em")
            .text(function(d) {
                if(d.label == "Paper") return d.id;
                return d.title;});

        // Use elliptical arc path segments to doubly-encode directionality.
        function tick() {
            path.attr("d", linkArc);
            circle.attr("transform", transform);
            text.attr("transform", transform);
        }

        function linkArc(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        }

        function transform(d) {
            return "translate(" + d.x + "," + d.y + ")";
        }
    }

    function update(data){
        console.log("updating");
        console.log(JSON.stringify(data));
        //d3.select("svg").remove();
        //draw(data);
        console.log("end")
    }
</script>
</body>
</html>
