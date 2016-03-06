$: << './lib'
require File.expand_path('../boot', __FILE__)

require "action_controller/railtie"
require "sprockets/railtie"
require "rizzo/assets"

if defined?(Bundler)
  Bundler.require(*Rails.groups(:assets => %w(development test)))
end

module Rizzo
  class Application < Rails::Application

    config.autoload_paths += %W(#{config.root}/lib)
    config.autoload_paths += %W(#{config.root}/lib/api)

    config.encoding = "utf-8"
    config.filter_parameters += [:password]
    config.active_support.escape_html_entities_in_json = true
    config.assets.enabled = true
    config.assets.version = '1.0'
    config.assets.precompile += Rizzo::Assets.precompile

    config.assets.paths << config.root.join('node_modules/rizzo-next/dist')
  end
end
