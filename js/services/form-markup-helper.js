'use strict';

formsAngular.factory('formMarkupHelper', [
  'cssFrameworkService', 'inputSizeHelper', 'addAllService',
  function (cssFrameworkService, inputSizeHelper, addAllService) {
    var exports = {};

    function generateNgShow(showWhen, model) {

      function evaluateSide(side) {
        var result = side;
        if (typeof side === 'string') {
          if (side.slice(0, 1) === '$') {
            result = (model || 'record') + '.';
            var parts = side.slice(1).split('.');
            if (parts.length > 1) {
              var lastBit = parts.pop();
              result += parts.join('.') + '[$index].' + lastBit;
            } else {
              result += side.slice(1);
            }
          } else {
            result = '\'' + side + '\'';
          }
        }
        return result;
      }

      var conditionText = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'],
        conditionSymbols = ['===', '!==', '>', '>=', '<', '<='],
        conditionPos = conditionText.indexOf(showWhen.comp);

      if (conditionPos === -1) { throw new Error('Invalid comparison in showWhen'); }
      return evaluateSide(showWhen.lhs) + conditionSymbols[conditionPos] + evaluateSide(showWhen.rhs);
    }


    exports.isHorizontalStyle = function (formStyle) {
      return (!formStyle || formStyle === 'undefined' || ['vertical', 'inline'].indexOf(formStyle) === -1);
    };

    exports.fieldChrome = function (scope, info, options) {
      var classes = '';
      var template = '';
      var closeTag = '';
      var insert = '';

      info.showWhen = info.showWhen || info.showwhen;  //  deal with use within a directive

      if (info.showWhen) {
        if (typeof info.showWhen === 'string') {
          insert += 'ng-show="' + info.showWhen + '"';
        } else {
          insert += 'ng-show="' + generateNgShow(info.showWhen, options.model) + '"';
        }
      }
      insert += ' id="cg_' + info.id.replace(/\./g, '-') + '"';


      if (cssFrameworkService.framework() === 'bs3') {
        classes = 'form-group';
        if (options.formstyle === 'vertical' && info.size !== 'block-level') {
          template += '<div class="row">';
          classes += ' col-sm-' + inputSizeHelper.sizeAsNumber(info.size);
          closeTag += '</div>';
        }

        var modelControllerName;
        var formName = null;
        var parts = info.name.split('.');

        if (options && typeof options.subkeyno !== 'undefined') {
          modelControllerName = options.subschemaroot.replace(/\./g, '-') + '-subkey' + options.subkeyno + '-' + parts[parts.length-1];
        } else if (options.subschema) {
          formName = 'form_' + parts[0] + '$index';
          modelControllerName = info.name.replace(/\./g, '-');
        } else {
          modelControllerName = 'f_' + info.name.replace(/\./g,'_');
        }

        template += '<div' + addAllService.addAll(scope, 'Group', classes, options)+' ng-class="{\'has-error\': hasError(\'' + formName + '\',\'' + modelControllerName + '\', $index)}"';
        closeTag += '</div>';
      } else {
        if (exports.isHorizontalStyle(options.formstyle)) {
          template += '<div' + addAllService.addAll(scope, 'Group', 'control-group', options);
          closeTag = '</div>';
        } else {
          template += '<span ';
          closeTag = '</span>';
        }
      }
      template += (insert || '') + '>';
      return {template: template, closeTag: closeTag};
    };

    exports.label = function (scope, fieldInfo, addButtonMarkup, options) {
      var labelHTML = '';
      if ((cssFrameworkService.framework() === 'bs3' || (options.formstyle !== 'inline' && fieldInfo.label !== '')) || addButtonMarkup) {
        labelHTML = '<label';
        var classes = 'control-label';
        if (exports.isHorizontalStyle(options.formstyle)) {
          labelHTML += ' for="' + fieldInfo.id + '"';
          if (typeof fieldInfo.labelDefaultClass !== 'undefined') {
            // Override default label class (can be empty)
            classes += ' ' + fieldInfo.labelDefaultClass;
          } else if (cssFrameworkService.framework() === 'bs3') {
            classes += ' col-sm-3';
          }
        } else if (options.formstyle === 'inline') {
          labelHTML += ' for="' + fieldInfo.id + '"';
          classes += ' sr-only';
        }
        labelHTML += addAllService.addAll(scope, 'Label', null, options) + ' class="' + classes + '">' + fieldInfo.label;
        if (addButtonMarkup) {
          labelHTML += ' <i id="add_' + fieldInfo.id + '" ng-click="add(\'' + fieldInfo.name + '\',$event)" class="' + exports.glyphClass() + '-plus-sign"></i>';
        }
        labelHTML += '</label>';
      }
      return labelHTML;
    };

    exports.glyphClass = function() {
      return (cssFrameworkService.framework() === 'bs2') ? 'icon' : 'glyphicon glyphicon';
    };

    exports.allInputsVars = function (scope, fieldInfo, options, modelString, idString, nameString) {

      var placeHolder = fieldInfo.placeHolder;

      var common;
      var compactClass = '';
      var sizeClassBS3 = '';
      var sizeClassBS2 = '';
      var formControl = '';

      if (cssFrameworkService.framework() === 'bs3') {
        compactClass = (['horizontal', 'vertical', 'inline'].indexOf(options.formstyle) === -1) ? ' input-sm' : '';
        sizeClassBS3 = 'col-sm-' + inputSizeHelper.sizeAsNumber(fieldInfo.size);
        formControl = ' form-control';
      } else {
        sizeClassBS2 = (fieldInfo.size ? ' input-' + fieldInfo.size : '');
      }

      if (options.formstyle === 'inline') {
        placeHolder = placeHolder || fieldInfo.label;
      }
      common = 'ng-model="' + modelString + '"' + (idString ? ' id="' + idString + '" name="' + idString + '" ' : ' name="' + nameString + '" ');
      common += (placeHolder ? ('placeholder="' + placeHolder + '" ') : '');
      if (fieldInfo.popup) {
        common += 'title="' + fieldInfo.popup + '" ';
      }
      common += addAllService.addAll(scope, 'Field', null, options);
      return {
        common: common,
        sizeClassBS3: sizeClassBS3,
        sizeClassBS2: sizeClassBS2,
        compactClass: compactClass,
        formControl: formControl
      };
    };

    exports.inputChrome = function (value, fieldInfo, options, markupVars) {
      if (cssFrameworkService.framework() === 'bs3' && exports.isHorizontalStyle(options.formstyle) && fieldInfo.type !== 'checkbox') {
        value = '<div class="bs3-input ' + markupVars.sizeClassBS3 + '">' + value + '</div>';
      }
      if (fieldInfo.helpInline) {
        value += '<span class="' + (cssFrameworkService.framework() === 'bs2' ? 'help-inline' : 'help-block') + '">' + fieldInfo.helpInline + '</span>';
      }
      if (fieldInfo.help) {
        value += '<span class="help-block">' + fieldInfo.help + '</span>';
      }
      return value;
    };

    exports.generateSimpleInput = function (common, fieldInfo, options) {
      var result = '<input ' + common + 'type="' + fieldInfo.type + '"';
      if (options.formstyle === 'inline' && cssFrameworkService.framework() === 'bs2' && !fieldInfo.size) {
        result += 'class="input-small"';
      }
      result += ' />';
      return result;
    };

    exports.controlDivClasses = function (options) {
      var result = [];
      if (exports.isHorizontalStyle(options.formstyle)) {
        result.push(cssFrameworkService.framework() === 'bs2' ? 'controls' : 'col-sm-9');
      }
      return result;
    };

    exports.handleInputAndControlDiv = function (inputMarkup, controlDivClasses) {
      if (controlDivClasses.length > 0) {
        inputMarkup = '<div class="' + controlDivClasses.join(' ') + '">' + inputMarkup + '</div>';
      }
      return inputMarkup;
    };

    exports.handleArrayInputAndControlDiv = function(inputMarkup, controlDivClasses, info, options) {
      var result = '<div ';
      if (cssFrameworkService.framework() === 'bs3') { result += 'ng-class="skipCols($index)" '; }
      result += 'class="' + controlDivClasses.join(' ') + '" id="' + info.id + 'List" ';
      result += 'ng-repeat="arrayItem in ' + (options.model || 'record') + '.' + info.name + ' track by $index">';
      result += inputMarkup;
      result += '<i ng-click="remove(\'' + info.name + '\',$index,$event)" id="remove_' + info.id + '_{{$index}}" class="' + exports.glyphClass() + '-minus-sign"></i>';
      result += '</div>';
      return result;
    };

    exports.addTextInputMarkup = function(allInputsVars, fieldInfo, requiredStr) {
      var result = '';
      var setClass = allInputsVars.formControl.trim() + allInputsVars.compactClass + allInputsVars.sizeClassBS2 + (fieldInfo.class ? ' ' + fieldInfo.class : '');
      if (setClass.length !== 0) { result += 'class="' + setClass + '"' ; }
      if (fieldInfo.add) { result += ' ' + fieldInfo.add + ' '; }
      result += requiredStr + (fieldInfo.readonly ? ' readonly' : '') + ' ';
      return result;
    };

    return exports;
  }]);

