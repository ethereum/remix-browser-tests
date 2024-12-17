import { CustomTooltip, RenderIf } from "@remix-ui/helper"
import { FormattedMessage } from "react-intl"
import { ConfigurationsProps, PrimeValue } from "../types"

export function Configurations ({primeValue, setPrimeValue, versionValue}: ConfigurationsProps) {
  return (
    <div className="flex-column">
      <div className="flex-column d-flex">
        <div className="ml-0">
          <label className="circuit_inner_label form-check-label" htmlFor="circuitPrimeSelector">
            <FormattedMessage id="circuit.prime" />
          </label>
          <CustomTooltip
            placement={"auto"}
            tooltipId="circuitPrimeLabelTooltip"
            tooltipClasses="text-nowrap"
            tooltipText={<span>{'To choose the prime number to use to generate the circuit. Receives the name of the curve (bn128, bls12381, goldilocks, grumpkin, pallas, vesta)'}</span>}
          >
            <div>
              <select
                onChange={(e) => setPrimeValue(e.target.value as PrimeValue)}
                value={primeValue}
                className="custom-select"
                style={{
                  pointerEvents: 'auto'
                }}
              >
                <RenderIf condition={versionValue === '2.1.5'}>
                  <>
                    <option value="bn128">bn128</option>
                    <option value="bls12381">bls12381</option>
                    <option value="goldilocks">goldilocks</option>
                  </>
                </RenderIf>
                <RenderIf condition={versionValue === '2.1.6'}>
                  <>
                    <option value="bn128">bn128</option>
                    <option value="bls12381">bls12381</option>
                    <option value="goldilocks">goldilocks</option>
                    <option value="grumpkin">grumpkin</option>
                    <option value="pallas">pallas</option>
                    <option value="vesta">vesta</option>
                  </>
                </RenderIf>
                <RenderIf condition={versionValue === '2.1.7'}>
                  <>
                    <option value="bn128">bn128</option>
                    <option value="bls12381">bls12381</option>
                    <option value="goldilocks">goldilocks</option>
                    <option value="grumpkin">grumpkin</option>
                    <option value="pallas">pallas</option>
                    <option value="vesta">vesta</option>
                  </>
                </RenderIf>
                <RenderIf condition={versionValue === '2.1.8' || versionValue === 'latest'}>
                  <>
                    <option value="bn128">bn128</option>
                    <option value="bls12381">bls12381</option>
                    <option value="goldilocks">goldilocks</option>
                    <option value="grumpkin">grumpkin</option>
                    <option value="pallas">pallas</option>
                    <option value="vesta">vesta</option>
                    <option value="secq256r1">secq256r1</option>
                  </>
                </RenderIf>
              </select>
            </div>
          </CustomTooltip>
        </div>
      </div>
    </div>
  )
}