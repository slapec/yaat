# coding: utf-8

import json

from django.http import HttpResponse
from django.shortcuts import render

def generate_table(cols, rows):
    table = []
    for i in range(rows):
        row = []
        table.append(row)
        for j in range(cols):
            row.append('{1}, {0}'.format(i, j))
    return table

def generate_header(table):
    headers = []
    for i, _ in enumerate(table[0]):
        headers.append({
            'key': 'key-{0}'.format(i),
            'value': 'Head-{0}'.format(i),
            'desc': False,
            'hidden': False
        })
    return headers

def index(request):
    return render(request, 'index.html')

def api(request):
    COLS = 3
    ROWS = 10
    rows = generate_table(COLS, ROWS)
    columns = generate_header(rows)

    print(request.body.decode())

    reply = {
        'columns': columns,
        'rows': rows
    }

    return HttpResponse(json.dumps(reply), content_type='application/json')
