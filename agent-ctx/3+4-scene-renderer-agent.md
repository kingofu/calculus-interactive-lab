# Task 3+4: Scene Renderer Agent

## Task
Add 13 new single-variable calculus scene renderers (2D modes) to scene-renderer.tsx

## Work Summary

### Components Added
1. `Axes2D` - Reusable 2D axes with grid, tick marks, and labels
2. `FilledRegion2D` - Reusable filled region between curve and baseline
3. `Continuity1Scene` - Continuous vs discontinuous function comparison
4. `Discontinuity1Scene` - 4 types of discontinuity (removable, jump, infinite, oscillating)
5. `ImportantLimits1Scene` - sin(x)/x→1 and (1+1/x)^x→e
6. `Lhopital1Scene` - L'Hôpital's rule: sin(x)/x vs cos(x)/1
7. `Monotonicity1Scene` - Monotonicity with derivative and colored regions
8. `Extrema1Scene` - Local maxima and minima markers
9. `Concavity1Scene` - Concave up/down regions with inflection point
10. `Curvature1Scene` - Curvature circle at observation point
11. `HigherDerivative1Scene` - Higher-order derivatives of sin(x)
12. `Substitution1Scene` - Integration by substitution (3 types)
13. `IntegrationByParts1Scene` - Integration by parts (3 types)
14. `ImproperIntegral1Scene` - Convergent/divergent improper integrals
15. `PolarArea1Scene` - Polar curve area with cardioid

### Mode Cases Added in SceneRenderer
All 13 modes added as JSX conditional rendering after the `volume_rev1` case.

### Verification
- `bun run lint` passes with zero errors
- Dev server compiles successfully
