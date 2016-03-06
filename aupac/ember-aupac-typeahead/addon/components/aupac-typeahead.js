import Ember from 'ember';
import footerTemplate from '../templates/components/aupac-typeahead/footer';
import headerTemplate from '../templates/components/aupac-typeahead/header';
import notFoundTemplate from '../templates/components/aupac-typeahead/not-found';
import pendingTemplate from '../templates/components/aupac-typeahead/pending';
import suggestionTemplate from '../templates/components/aupac-typeahead/suggestion';

const {computed, observer, isNone, run, debug, Component} = Ember;

const Key = {
  BACKSPACE : 8,
  DELETE : 46
};

export default Component.extend({
  //input tag attributes
  tagName : 'input',
  classNames: ['aupac-typeahead'],
  attributeBindings : ['disabled','placeholder', 'name'],
  disabled : false, //@public
  placeholder : 'Search', //@public
  name : '', //@public

  //Actions
  action: Ember.K, //@public
  selection : null, //@public
  source : Ember.K, //@public

  //typeahead.js Customizations
  highlight: true, //@public
  hint: true, //@public
  minLength: 2, //@public
  typeaheadClassNames: {}, //@public
  autoFocus: false, //@public
  limit : 15, //@public
  async : false, //@public
  datasetName : '', //@public

  //HtmlBars Templates
  suggestionTemplate,  //@public
  notFoundTemplate,  //@public
  pendingTemplate,  //@public
  headerTemplate,  //@public
  footerTemplate,  //@public

  /**
   * @public
   * @param selection - the item selected by the user
   * @returns {*}
   */
  display : function(selection) {
    return selection;
  },

  /**
   * @public
   * @param selection the item selected by the user
   */
  setValue : function(selection) {
    if(selection) {
      this.get('_typeahead').typeahead('val', selection);
    } else {
      this.get('_typeahead').typeahead('val', '');
    }
  },

  //Private
  _typeahead: null,

  // shadow the passed-in `selection` to avoid
  // leaking changes to it via a 2-way binding
  _selection: computed.reads('selection'),

  didInsertElement: function () {
    this._super(...arguments);
    this.initializeTypeahead();
    if (this.get('autoFocus') === true) {
      this.get('_typeahead').focus();
    }
    this.addObserver('disabled', this.disabledStateChanged);
  },

  disabledStateChanged() {
    //Toggling the disabled attribute on the controller does not update the hint, need to do this manually.
    this.$('input.tt-hint').prop('disabled', this.get('disabled'));
  },

  initializeTypeahead: function() {
    const self = this;
    //Setup the typeahead
    const t = this.$().typeahead({
      highlight: this.get('highlight'),
      hint: this.get('hint'),
      minLength: this.get('minLength'),
      classNames: this.get('typeaheadClassNames')
      }, {
        component : this,
        name: this.get('datasetName') || 'default',
        display: this.get('display'),
        async: this.get('async'),
        limit: this.get('limit'),
        source: this.get('source'),
        templates: {
          suggestion: function (model) {
            const item = Component.create({
              model: model,
              layout: self.get('suggestionTemplate')
            }).createElement();
            return item.element;
          },
          notFound: function (query) {
            const item = Component.create({
              query: query,
              layout: self.get('notFoundTemplate')
            }).createElement();
            return item.element;
          },
          pending: function (query) {
            const item = Component.create({
              query: query,
              layout: self.get('pendingTemplate')
            }).createElement();
            return item.element;
          },
          header: function (query, suggestions) {
            const item = Component.create({
              query: query,
              suggestions: suggestions,
              layout: self.get('headerTemplate')
            }).createElement();
            return item.element;
          },
          footer: function (query, suggestions) {
            const item = Component.create({
              query: query,
              suggestions: suggestions,
              layout: self.get('footerTemplate')
            }).createElement();
            return item.element;
          }
        }
    });
    this.set('_typeahead', t);

    // Set selected object
    t.on('typeahead:autocompleted', run.bind(this, (jqEvent, suggestionObject /*, nameOfDatasetSuggestionBelongsTo*/) => {
      this.set('_selection', suggestionObject);
      this.sendAction('action', suggestionObject);
    }));

    t.on('typeahead:selected', run.bind(this, (jqEvent, suggestionObject /*, nameOfDatasetSuggestionBelongsTo*/) => {
      this.set('_selection', suggestionObject);
      this.sendAction('action', suggestionObject);
    }));

    t.on('keyup', run.bind(this, (jqEvent) => {
      //Handle the case whereby the user presses the delete or backspace key, in either case
      //the selection is no longer valid.
      if (jqEvent.which === Key.BACKSPACE || jqEvent.which === Key.DELETE) {
        debug("Removing model");
        const value = this.get('_typeahead').typeahead('val'); //cache value
        this.set('_selection', null);
        this.sendAction('action', null);
        this.setValue(value); //restore the text, thus allowing the user to make corrections
      }
    }));

    t.on('focusout', run.bind(this, (/*jqEvent*/) => {
      //the user has now left the control, update display with current binding or reset to blank
      const model = this.get('_selection');
      if (model) {
        this.setValue(model);
      } else {
        this.setValue(null);
      }
    }));

  },

  // Fix weird bug whereby changing the bound selection to null would not fire "selectionUpdated"
  //boundSelectionUpdated: observer('selection',function() {
  //  const selection = this.get('selection');
  //  if(isNone(selection)) {
  //    this.set('_selection', null);
  //  }
  //}),

  selectionUpdated: observer('_selection', '_typeahead',function() {
    const selection = this.get('_selection');
    if(isNone(selection)) {
      this.setValue(null);
    } else {
      this.setValue(selection);
    }
  }),

  willDestroyElement : function() {
    this._super(...arguments);
    this.get('_typeahead').typeahead('destroy');
  }

});
