/**
 * Created by Bean on 28-Jul-17.
 */

// provide the data in the vis format
var data = {};  //globally
var nodes = new vis.DataSet({});
var edges = new vis.DataSet({});
// functions to convert Neo4j res to dataset format
function idIndex(a, id) {
    for (var i = 0; i < a.length; i++) {
        if (a[i].id == id) return i;
    }
    return null;
}
//check object exist
Array.prototype.hasElement = function(element) {
    var i;
    for (i = 0; i < this.length; i++) {
        if (this[i]["from"] === element["from"] && this[i]["to"] === element["to"] && this[i]["type"] === element["type"]) {
            return i; //Returns element position, so it exists
        }
    }
    return -1; //The element isn't in your array
};

//check object's id exist
var hasId = function(element) {
    // retrieve a filtered subset of the data
    var items;
    if (element["id"] != undefined){
        items = nodes.get({
            filter: function (item) {
                return (item.id === element["id"]);
            }
        });
    }
    else {
        items = edges.get({
            filter: function (item) {
                return (item.from === element["from"] && item.to === element["to"] && item.type === element["type"]);
            }
        });
    }
    return items.length;
};

function convertToJson(res) {
    var nodes = [], links = [];
    res.results[0].data.forEach(function (row) {
        row.graph.nodes.forEach(function (n) {
            if (idIndex(nodes, n.id) == null) {
                if (n.properties.name) {
                    if (n.properties.name == "Topic Evolution") nodes.push({
                        id: n.id,
                        label: n.properties.name,
                        title: n.labels[0]
                    });
                    else nodes.push({id: n.id, label: n.properties.name,  group: n.labels[0]});     //topic
                }
                else if (n.properties.title)
                    nodes.push({id: n.id, label: n.id, title: n.properties.title, group: n.labels[0]});     //paper
                else   nodes.push({id: n.id, label: n.properties.value, group: n.labels[0]}) //timestamp
            }
        });
        row.graph.relationships.map(function (r) {
            var s = {from: r.startNode, to: r.endNode, title: r.type};
            if (links.hasElement(s) === -1) {
                links.push(s);
            }
        });
    });
    var data = {nodes: nodes, edges: links};
    return data;
};



$.ajaxSetup({
    headers: {
        "Authorization": 'Basic ' + window.btoa("neo4j" + ":" + "1234567")
    }
});

$.ajax({
    type: "POST",
    url: "http://localhost:7474/db/data/transaction/commit",
    data: JSON.stringify({
        statements: [{
            statement: "MATCH p=()-[r:has]-() return p",
            resultDataContents: ["row", "graph"]
        }]
    }),
    dataType: "json",
    contentType: "application/json;charset=UTF-8",
    error: function (err) {
        console.log(err)
    },
    success: function (res) {
        var jsonRes = convertToJson(res);
        nodes.add(jsonRes.nodes);
        edges.add(jsonRes.edges);
        data = {nodes: nodes, edges: edges};

        //create a network
        var container = document.getElementById('vis');

        // initialize your network!
        var options = {
            interaction:{hover:true},
            edges: {
                //title: function(edge){ return edge.type;}
            }
        };
        var network = new vis.Network(container, data, options);

        network.on("selectNode", function (params) {
            console.log('selectNode Event:', params);
            $.ajax({
                type: "POST",
                url: "http://localhost:7474/db/data/transaction/commit",
                data: JSON.stringify({
                    statements: [{
                        statement: "MATCH (t) WHERE ID(t) =" + params.nodes + " MATCH p=()-[]-(t) return p",
                        resultDataContents: ["row", "graph"]
                    }]
                }),
                dataType: "json",
                contentType: "application/json;charset=UTF-8",
                error: function (err) {
                    console.log(err)
                },
                success: function (res) {
                    var resJson2 = convertToJson(res);
                    console.log(resJson2.edges);
                    resJson2.nodes.forEach(function (node) {
                        if (hasId(node)===0) nodes.add(node);
                    })

                    resJson2.edges.forEach(function (edge) {
                        if (hasId(edge)===0) edges.add(edge);
                    })
                    network.stabilize;
                }
            });
        });
    }
});

