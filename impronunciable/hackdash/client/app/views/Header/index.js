
var 
    template = require('./templates/header.hbs')
  , Search = require('./Search')
  , DashboardHeader = require('./Dashboard')
  , DashboardsHeader = require('./Dashboards')
  , CollectionsHeader = require('./Collections')
  , CollectionHeader = require('./Collection');

module.exports = Backbone.Marionette.Layout.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "container",
  template: template,

  regions: {
    "search": ".search-ctn",
    "page": ".page-ctn"
  },

  ui: {
    pageTitle: ".page-title"
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: {
    hackdashURL: function(){
      return "http://" + hackdash.baseURL;
    },
    isDashboardAdmin: function(){
      var isDashboard = (hackdash.app.type === "dashboard" ? true : false);

      var user = hackdash.user;
      return isDashboard && user && user.admin_in.indexOf(this.domain) >= 0 || false;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    var type = window.hackdash.app.type;
    
    var self = this;
    function showSearch(placeholder){
      self.search.show(new Search({
        showSort: type === "dashboard",
        placeholder: placeholder,
        collection: self.collection
      }));
    }

    switch(type){
      case "isearch":
        showSearch("Type here to search projects");
        this.ui.pageTitle.text("Projects");
        this.setHeaders('Find Projects', 'Search projects at HackDash');
        break;

      case "dashboards":
        showSearch();
        this.setHeaders('Create collections', 'Create your collection at HackDash');
        this.page.show(new DashboardsHeader());
        break;

      case "dashboard":
        showSearch();
        
        if (this.model.get("_id")){
          
          this.setHeaders(
            this.model.get('title'), 
            this.model.get('description'));

          this.page.show(new DashboardHeader({
            model: this.model
          }));
        }
        break;

      case "collections":
        showSearch("Type here to search collections");
        this.setHeaders('Collections', 'Search collections at HackDash');
        this.page.show(new CollectionsHeader());
        break;

      case "collection":
        if (this.model.get("_id")){
           
          this.setHeaders(
            this.model.get('title'), 
            this.model.get('description'));

          this.page.show(new CollectionHeader({
            model: this.model
          }));
        }
        break;

      case "project":
        if (this.model.get("_id")){
          this.page.show(new DashboardHeader({
            model: this.model,
            readOnly: true
          }));
        }
        break;
    }

    $('.tooltips', this.$el).tooltip({});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  setHeaders: function(title, desc){
    window.hackdash.seo.title(title).desc(desc);    
  }

});