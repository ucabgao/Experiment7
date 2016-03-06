require 'spec_helper'

describe LayoutController do
  describe "#snippet" do
    describe "new nav bar" do
      render_views

      context "with no params" do
        it "returns the old navbar" do
          get :snippet, route: 'modern', snippet: 'header'

          response.body.should =~ /Basket/
        end
      end

      context "wih :shop_staging_navbar param present" do
        it "returns the new header" do
          get :snippet, route: 'modern', snippet: 'header', shop_staging_navbar: 'true'

          response.body.should_not =~ /Basket/
        end
      end
    end

  end
end
