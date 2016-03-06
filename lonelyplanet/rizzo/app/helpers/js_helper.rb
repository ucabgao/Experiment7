require 'sanitize'

module JsHelper
  LP_DEFAULT_JS_NAMESPACE = "window.lp"

  class Config
    JS_OBJECT_SEPARATOR_CHAR = "."
    JS_ROOT_NAMESPACE        = "window"

    attr_reader :root_namespace

    def initialize(root_namespace = JS_ROOT_NAMESPACE)
      @root_namespace = root_namespace
    end

    def configurations
      @configurations ||= Hash.new { |h, k| h[k] = {} }
    end

    def add(namespace, configuration)
      namespace_with_root = [root_namespace, namespace].compact.join(JS_OBJECT_SEPARATOR_CHAR)
      self.configurations[namespace_with_root].merge!(configuration)
    end

    def namespaces_to_vivify
      configurations.keys.each_with_object([]) do |namespace, m|
        parts = namespace.split(/#{Regexp.escape(JS_OBJECT_SEPARATOR_CHAR)}/)
        parts.length.times do |i|
          m << parts[0, i + 1].join(JS_OBJECT_SEPARATOR_CHAR)
        end
      end.uniq
    end
  end

  def configure_js(namespace, config)
    # source url
    @js_config ||= Config.new(LP_DEFAULT_JS_NAMESPACE)

    # Stop ads from loading in tests
    return if namespace == :ads && (Rails.env.test? || Rails.env.cucumber?)

    @js_config.add(namespace, config)
  end

  def js_configuration
    return unless @js_config
    js_closure(:call => true) do
      @js_config
    end
  end

  def js_closure(opts, &blk)
    config = yield blk
    keys = config.configurations.keys
    output = 'function extend(a,b){a=a||{};for(var c in b)"object"==typeof b[c]&&null!==b[c]&&b[c].constructor==Array?a[c]=b[c]:"object"==typeof b[c]?a[c]=extend(a[c],b[c]):a[c]=b[c];return a}'
    output << keys.reduce("#{config.root_namespace} = #{config.root_namespace} || {};") {|out, k| "#{out} #{k}=#{k}||{}; extend(#{k}, #{config.configurations[k].to_json});"}
    javascript_tag output
  end

  def js_hash(hash, target='window')
    output = ""
    hash.each do |k, v|
      if v.is_a?(Hash)
        output += "if (!#{target}.hasOwnProperty('#{k}')) #{target}.#{k} = {};"
        output += js_hash(v, "#{target}.#{k}")
      else
        v = js_sanitize(v) if v.is_a?(String)
        output += "#{target}.#{js_sanitize(k.to_s)} = #{v.to_json};"
      end
    end
    output
  end

  def js_sanitize(param)
    Sanitize.clean(param)
  end

end
