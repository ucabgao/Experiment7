class LayoutController < ActionController::Base
  before_filter :set_new_navbar_from_param

  layout nil

  include LayoutSupport

  def snippet
    render "layouts/custom/_#{params[:snippet]}", locals: get_layout_config(params[:route])
  end

  def preview
    @fixed_width_layout = true if params[:route] == "fixed-width"

    layout_details = get_layout(params[:route])
    render layout_details[:template], layout: layout_details[:layout], locals: get_layout_config(params[:route])
  end

  def set_new_navbar_from_param
    @shop_navbar_test = true if params[:shop_staging_navbar].present?
  end
end
