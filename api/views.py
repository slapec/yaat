# coding: utf-8

import json

from django.http import HttpResponse
from django.shortcuts import render


def index(request):
    return render(request, 'api/index.html')

def test(request):
    reply = {
        'columns': [
            {'key': 'name',
             'value': 'Név',
             'order': 'asc',
             'rows': [
                 'egy',
                 'kettő',
                 'három',
                 'négy'
             ]},
            {'key': 'value',
             'value': 'Érték',
             'order': 'asc',
             'rows': [
                 '1',
                 '2',
                 '3',
                 '4'
             ]}
        ]
    }

    return HttpResponse(json.dumps(reply), content_type='application/json')
