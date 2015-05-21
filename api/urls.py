# coding: utf-8

from django.conf.urls import url

from api.views import index, test

urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'test$', test, name='test')
]
