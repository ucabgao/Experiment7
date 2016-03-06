require 'spec_helper'

describe BetaHelper do
  PlacePresenter = Class.new unless defined? PlacePresenter
  ArticlesShowPresenter = Class.new unless defined? ArticlesShowPresenter

  let(:klass) { Class.new.instance_eval { include BetaHelper } }
  let(:instance) { klass.new }

  describe '#show_beta_banner' do
    let(:params) { Hash.new }
    before { allow(instance).to receive(:params).and_return(params) } 
    subject { instance.show_beta_banner }

    context 'when params are empty' do
      it { expect(subject).to eq false } 
    end

    context 'when params has beta key AND it is "destinations-next"' do
      let(:params) { { beta: 'destinations-next' } }
      it { expect(subject).to eq 1.0 }
    end
  end

  describe '#place_or_article?' do
    subject { instance.place_or_article? }

    context 'when PlacePresenter is not defined' do
      before { allow(instance).to receive(:place_presenter_defined?).and_return(false) }
      it { expect(subject).to be false }
    end

    context 'considering the presnter' do
      before { allow(instance).to receive(:place_presenter_defined?).and_return(true) }

      context 'when there is no presenter' do
        it { expect(subject).to eq false }
      end

      context 'when there is a presetner' do
        before { allow(instance).to receive(:presenter).and_return(presenter) }

        context 'when the presnter is an instance of PlacePresenter' do
          let(:presenter) { double is_a?: true }
          it { expect(subject).to eq true }
        end

        context 'when the presenter is not an instance of PlacePresenter' do
          let(:presenter) { double is_a?: false }
          it { expect(subject).to eq false }
        end
      end
    end
  end
end
