# coding: utf-8

from django.conf.urls import url

from .views import index, api

urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'api$', api, name='api')
]