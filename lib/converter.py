import cPickle as p
import pandas as pd
import numpy as np
from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier
import json
import pprint

from pdb import set_trace


def tree_into_nodes(model, features, targets):
    input_nodes = model.tree_.__getstate__()['nodes']
    values      = model.tree_.value
    input_nodes = [list(x) + list(y) for x,y in zip(input_nodes,values)]

    nodes = {}
    paths = []
    
    def traverse_nodes(node, level, previous_node, direction=None):
        target        = targets[np.argmax(node[7])]
        target_num    = max(node[7])
        target_totals = {x[0]: x[1] for x in zip(targets, node[7])}

        # name based on leaf or switch
        node_name = None
        if (node[0] != -1) and (node[1] != -1):
            node_name = str(features[node[2]]) + ' <= ' + str(node[3])
        else:
            node_name = str(target) + ': ' + str(target_num)

        # ensures uniqueness of name
        counter = 0
        base_node_name = node_name
        while node_name in nodes.keys():
            counter   += 1
            node_name = base_node_name + ' (%s)' % str(counter)

        # sets previous node's left and right
        if direction == 'left':
            previous_node['left'] =  node_name
        elif direction == 'right':
            previous_node['right'] =  node_name

        nodes[node_name] = {
            'show_name': base_node_name,
            'name': node_name,
            'level': int(level) + 1,
            'feature': features[node[2]],
            'n_node_samples': node[5],
            'threshold': node[3],
            'impurity': node[4],
            'target': target
        }
        nodes[node_name].update(target_totals)

        if previous_node != None:
            paths.append({
                'origin': previous_node['name'],
                'destination': node_name,
            })

        if node[0] != -1:
            traverse_nodes(input_nodes[node[0]], level+1, nodes[node_name], 'left')
            
        if node[1] != -1:
            traverse_nodes(input_nodes[node[1]], level+1, nodes[node_name], 'right')
    
        return

    traverse_nodes(input_nodes[0], 0, None)

    max_level = max([nodes[node]['level'] for node in nodes])

    return nodes, paths, max_level

def tree_to_json(model, features, targets):

    nodes, paths, max_level = tree_into_nodes(model, features, targets)

    data = {'series': paths,
            'nodes' : nodes,
            'levels': max_level}

    pp = pprint.PrettyPrinter()
    pp.pprint(data)
    
    json.dump(data, open('static/data/decision_tree.json', 'wb'))


    
def iris_data_set():
    iris = load_iris()
    data = pd.DataFrame(iris['data'])
    data.columns = iris['feature_names']
    data['target'] = iris['target']
    data['target_name'] = data.target.apply(lambda x: iris['target_names'][x])

    json.dump(data.to_dict('record'), open('static/data/flower_data.json', 'wb'))

    dt = DecisionTreeClassifier(max_depth=5)
    dt = dt.fit(data[['sepal length (cm)','sepal width (cm)','petal length (cm)']].values, data['target'].values)

    tree_to_json(dt, ['sepal length (cm)','sepal width (cm)','petal length (cm)'], iris['target_names'])
