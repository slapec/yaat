# coding: utf-8

import json
from pprint import pformat

from django.http import HttpResponse
from django.shortcuts import render

def generate_table(cols, rows):
    table = []
    for i in range(1, rows+1):
        row = {'id': '{0}'.format(i), 'values': []}
        table.append(row)
        for j in range(1, cols+1):
            row['values'].append('{1}, {0}'.format(i, j))
    return table

def generate_header(table):
    headers = []
    by_key = {}
    for i, _ in enumerate(table[0]['values']):
        data = {
            'key': str(i),
            'value': 'Head-{0}'.format(i),
            'desc': False,
            'hidden': False
        }
        headers.append(data)
        by_key[data['key']] = data
    return headers, by_key

def index(request):
    return render(request, 'index.html')

COLS = 10
ROWS = 100
rows = generate_table(COLS, ROWS)
columns, by_key = generate_header(rows)

def api(request):
    # TODO: Create some models
    body = json.loads(request.body.decode('utf-8'))
    #print(pformat(body))

    offset = 0 if body['offset'] is None else body['offset']
    limit = int(body['limit'])

    _columns = []
    if 'headers' in body:
        for header in body['headers']:
            h = by_key[header['key']]
            h['hidden'] = header['hidden']
            h['desc'] = header['desc']

            _columns.append(h)
    else:
        _columns = columns

    _rows = []
    for row in rows[offset:limit+offset]:
        _row = []
        for header in _columns:
            if not header['hidden']:
                _row.append(row['values'][int(header['key'])])
        _rows.append({'id': row['id'], 'values': _row})

    reply = {
        'columns': _columns,
        'rows': _rows,
        'pages': {
            'list': [
                {'key': 0 if offset - limit < 0 else offset - limit, 'value': '<'},
                {'key': offset, 'value': offset},
                {'key': offset if offset + limit >= ROWS else offset + limit, 'value': '>'}
            ],
            'current': 0
        }
    }

    return HttpResponse(json.dumps(reply, separators=(',', ':')), content_type='application/json')
