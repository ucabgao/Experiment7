# Deprecated 1-13-16, but keeping around for reference (for now)
module BetaHelper
  # Look for a place presenter from Waldorf
  def place_or_article?
    return false unless place_presenter_defined?
    return false unless respond_to? :presenter
    return true if defined?(::PlacePresenter) && presenter.is_a?(::PlacePresenter)
    return true if defined?(::ArticlesShowPresenter) && presenter.is_a?(::ArticlesShowPresenter)
    false
  end
  alias_method :is_place_or_article?, :place_or_article?

  # Show banner when ?beta=destinations-next is in the URL
  def show_beta_banner
    return 1.0 if params[:beta] == 'destinations-next'

    # prng = Random.new(Time.now.to_i)
    # prng.rand < 0.01
    false
  end

  def show_new_header?
    @shop_navbar_test || cookies[:_v] == '_split-12-destinations-next'
  end

  private

  def place_presenter_defined?
    defined? PlacePresenter || defined? ArticlesShowPresenter
  end
end
